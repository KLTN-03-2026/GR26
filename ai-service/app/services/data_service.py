"""
Data Service — đọc dữ liệu từ PostgreSQL của BE.

Nguyên tắc bắt buộc:
- Mọi query ĐỀU filter tenant_id (multi-tenant)
- Service này chỉ READ bảng của BE — không ghi
- Nguồn consumption: inventory_transactions WHERE type='SALE_DEDUCT'
  (AI Service không cần join orders → order_items → recipes vì
   BE đã tự deduct kho khi order hoàn thành)
"""

from datetime import date, timedelta

import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.repositories.series_registry_repo import SeriesRegistryRepo

logger = get_logger(__name__)

async def get_ingredient_consumption(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
    ingredient_id: str,
    days_back: int = 180,
) -> pd.DataFrame:
    """
    Lấy lịch sử tiêu thụ nguyên liệu theo ngày từ inventory_transactions.

    Dùng type='SALE_DEDUCT' — BE tự deduct kho sau mỗi đơn hoàn thành.
    quantity trong bảng là số âm (xuất kho), ta lấy ABS để có lượng tiêu thụ.

    Args:
        db: AsyncSession
        tenant_id: BẮT BUỘC — filter multi-tenant
        branch_id: UUID chi nhánh
        ingredient_id: UUID nguyên liệu (items.id WHERE type='INGREDIENT')
        days_back: Số ngày lịch sử cần lấy (mặc định 180 ngày)

    Returns:
        DataFrame với cột ['ds' (datetime64), 'y' (float)] — chuẩn NeuralProphet
        Trả về DataFrame rỗng nếu không có data
    """
    start_date = date.today() - timedelta(days=days_back)

    sql = text("""
        SELECT
            DATE(created_at)          AS ds,
            SUM(ABS(quantity))        AS y
        FROM inventory_transactions
        WHERE tenant_id       = :tenant_id
          AND branch_id       = :branch_id
          AND item_id         = :ingredient_id
          AND type            = 'SALE_DEDUCT'
          AND quantity        < 0
          AND created_at     >= :start_date
        GROUP BY DATE(created_at)
        ORDER BY ds ASC
    """)

    result = await db.execute(sql, {
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "ingredient_id": ingredient_id,
        "start_date": start_date,
    })
    rows = result.fetchall()

    if not rows:
        logger.warning(
            "Không có data tiêu thụ: tenant=%s branch=%s ingredient=%s days_back=%d",
            tenant_id, branch_id, ingredient_id, days_back,
        )
        return pd.DataFrame(columns=["ds", "y"])

    df = pd.DataFrame(rows, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].astype(float)

    logger.info(
        "Lấy consumption: tenant=%s branch=%s ingredient=%s → %d ngày",
        tenant_id, branch_id, ingredient_id, len(df),
    )
    return df


async def get_current_stock(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
    ingredient_id: str,
) -> float:
    """
    Lấy tồn kho hiện tại từ inventory_balances.

    Args:
        tenant_id: BẮT BUỘC — không bao giờ query thiếu filter này

    Returns:
        Số lượng tồn kho theo đơn vị nguyên liệu, 0.0 nếu không có record
    """
    sql = text("""
        SELECT quantity
        FROM inventory_balances
        WHERE tenant_id = :tenant_id
          AND branch_id = :branch_id
          AND item_id   = :ingredient_id
        LIMIT 1
    """)

    result = await db.execute(sql, {
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "ingredient_id": ingredient_id,
    })
    row = result.fetchone()

    if row is None:
        logger.warning(
            "Không có inventory balance: tenant=%s branch=%s ingredient=%s",
            tenant_id, branch_id, ingredient_id,
        )
        return 0.0

    return float(row[0])


async def get_all_ingredients_of_branch(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
) -> list[dict]:
    """
    Lấy danh sách nguyên liệu đang có trong kho của chi nhánh.
    Chỉ lấy items có tồn kho trong inventory_balances.

    Returns:
        List[dict] với keys: id (str), name (str), unit (str)
    """
    sql = text("""
        SELECT
            i.id::text      AS id,
            i.name          AS name,
            i.unit          AS unit
        FROM inventory_balances ib
        JOIN items i ON i.id = ib.item_id
        WHERE ib.tenant_id = :tenant_id
          AND ib.branch_id = :branch_id
          AND i.type       = 'INGREDIENT'
          AND i.deleted_at IS NULL
        ORDER BY i.name ASC
    """)

    result = await db.execute(sql, {
        "tenant_id": tenant_id,
        "branch_id": branch_id,
    })
    rows = result.fetchall()
    return [{"id": r[0], "name": r[1], "unit": r[2]} for r in rows]


async def get_all_active_branches(
    db: AsyncSession,
    tenant_id: str,
) -> list[dict]:
    """
    Lấy danh sách chi nhánh đang ACTIVE của tenant.
    Bao gồm lat/lng để fetch thời tiết từ Open-Meteo.

    Args:
        tenant_id: BẮT BUỘC filter

    Returns:
        List[dict] với keys: id (str), name (str), latitude (float|None), longitude (float|None)
    """
    sql = text("""
        SELECT
            id::text        AS id,
            name            AS name,
            latitude        AS latitude,
            longitude       AS longitude
        FROM branches
        WHERE tenant_id = :tenant_id
          AND status    = 'ACTIVE'
        ORDER BY name ASC
    """)

    result = await db.execute(sql, {"tenant_id": tenant_id})
    rows = result.fetchall()
    return [
        {
            "id": r[0],
            "name": r[1],
            "latitude": float(r[2]) if r[2] is not None else None,
            "longitude": float(r[3]) if r[3] is not None else None,
        }
        for r in rows
    ]


async def get_all_active_tenants(db: AsyncSession) -> list[str]:
    """
    Lấy danh sách tenant_id đang ACTIVE — dùng trong cron train job.
    Đây là query DUY NHẤT không filter tenant_id (vì đang lấy tất cả tenant).

    Returns:
        List[str] — danh sách tenant_id (UUID as string)
    """
    sql = text("""
        SELECT id::text
        FROM tenants
        WHERE status = 'ACTIVE'
        ORDER BY created_at ASC
    """)

    result = await db.execute(sql)
    rows = result.fetchall()
    tenant_ids = [r[0] for r in rows]

    logger.info("Tìm thấy %d tenant active", len(tenant_ids))
    return tenant_ids


async def get_consumption_for_all_ingredients(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
    days_back: int = 180,
) -> pd.DataFrame:
    """
    Lấy toàn bộ lịch sử tiêu thụ của tất cả nguyên liệu trong 1 chi nhánh.
    Dùng để build Global Model DataFrame thay vì gọi từng nguyên liệu một.

    Returns:
        DataFrame với cột ['ds', 'y', 'ID'] — chuẩn NeuralProphet Global Model
        ID = "{tenant_id}__{ingredient_id}__{branch_id}"
    """
    start_date = date.today() - timedelta(days=days_back)

    sql = text("""
        SELECT
            DATE(it.created_at)                        AS ds,
            SUM(ABS(it.quantity))                      AS y,
            it.item_id::text                           AS ingredient_id
        FROM inventory_transactions it
        JOIN items i ON i.id = it.item_id
        WHERE it.tenant_id  = :tenant_id
          AND it.branch_id  = :branch_id
          AND it.type       = 'SALE_DEDUCT'
          AND it.quantity   < 0
          AND it.created_at >= :start_date
          AND i.type        = 'INGREDIENT'
          AND i.deleted_at  IS NULL
        GROUP BY DATE(it.created_at), it.item_id
        ORDER BY ds ASC, it.item_id
    """)

    result = await db.execute(sql, {
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "start_date": start_date,
    })
    rows = result.fetchall()

    if not rows:
        logger.warning(
            "Không có consumption data: tenant=%s branch=%s days_back=%d",
            tenant_id, branch_id, days_back,
        )
        return pd.DataFrame(columns=["ds", "y", "ID"])

    df = pd.DataFrame(rows, columns=["ds", "y", "ingredient_id"])
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].astype(float)

    # Build series ID theo chuẩn NeuralProphet Global Model
    df["ID"] = (
        tenant_id + "__" + df["ingredient_id"] + "__" + branch_id
    )
    df = df.drop(columns=["ingredient_id"])

    logger.info(
        "Global consumption: tenant=%s branch=%s → %d rows, %d series",
        tenant_id, branch_id, len(df), df["ID"].nunique(),
    )
    return df


# ---------------------------------------------------------------------------
# Alias + New functions — cần thiết cho train_service, test_data_service
# ---------------------------------------------------------------------------

async def get_active_tenants(db: AsyncSession) -> list[str]:
    """
    Alias của get_all_active_tenants — giữ tương thích với train_service.

    Returns:
        List tenant_id đang ACTIVE
    """
    return await get_all_active_tenants(db)


async def get_branch_coordinates(
    db: AsyncSession,
    branch_id: str,
) -> tuple[float, float] | None:
    """
    Lấy tọa độ (latitude, longitude) của chi nhánh.

    Args:
        branch_id: UUID chi nhánh (string)

    Returns:
        Tuple (lat, lng) hoặc None nếu không có tọa độ / không tìm thấy
    """
    sql = text("""
        SELECT latitude, longitude
        FROM branches
        WHERE id::text = :branch_id
        LIMIT 1
    """)
    result = await db.execute(sql, {"branch_id": branch_id})
    row = result.fetchone()

    if row is None or row[0] is None or row[1] is None:
        return None

    return float(row[0]), float(row[1])


def _build_and_fill(
    day_rows: list[tuple],
    start_date: date,
    series_id: str,
) -> pd.DataFrame:
    """
    Tạo DataFrame đầy đủ ngày từ start_date đến ngày cuối trong day_rows.

    Điền y=0 cho các ngày không có data (không bán hàng).
    Dùng để build DataFrame chuẩn NeuralProphet trước khi train.

    Args:
        day_rows: List tuple (date, float) — ngày và lượng tiêu thụ
        start_date: Ngày bắt đầu của kỳ lịch sử
        series_id: ID series dạng "s{int}" — gán vào cột ID

    Returns:
        DataFrame với cột [ds (datetime64), y (float), ID (str)]
        DataFrame rỗng nếu day_rows rỗng
    """
    if not day_rows:
        return pd.DataFrame(columns=["ds", "y", "ID"])

    # Map ngày → lượng tiêu thụ
    dates_dict: dict[date, float] = {row[0]: float(row[1]) for row in day_rows}
    end_date = max(dates_dict.keys())

    # Tạo dãy ngày liên tục từ start_date → end_date
    date_range = pd.date_range(start=start_date, end=end_date, freq="D")
    df = pd.DataFrame({"ds": date_range})

    # Gán y — ngày không có data = 0 (không bán)
    df["y"] = df["ds"].dt.date.map(lambda d: dates_dict.get(d, 0.0))
    df["ID"] = series_id

    return df


async def get_recent_consumption(
    db: AsyncSession,
    series_id: str,
    days: int = 14,
) -> pd.DataFrame:
    """
    Lấy lịch sử tiêu thụ gần nhất từ bảng consumption_history.

    Khác với get_ingredient_consumption (query inventory_transactions trực tiếp),
    hàm này đọc từ consumption_history đã được xử lý sẵn — nhanh hơn khi predict.

    Args:
        series_id: ID series dạng "s{int}" — e.g. "s42"
        days: Số ngày gần nhất cần lấy (mặc định 14)

    Returns:
        DataFrame với cột [ds (datetime64), y (float)]
        DataFrame rỗng nếu chưa có history

    Raises:
        ValueError: series_id không đúng format s{int}
    """
    # Validate format — phải là "s{int}"
    if not (series_id.startswith("s") and len(series_id) > 1 and series_id[1:].isdigit()):
        raise ValueError(
            f"series_id phải có format s{{int}} (ví dụ: 's42'), nhận được: {series_id!r}"
        )

    series_pk = int(series_id[1:])
    start_date = date.today() - timedelta(days=days)

    sql = text("""
        SELECT ds, y
        FROM consumption_history
        WHERE series_id = :series_pk
          AND ds >= :start_date
        ORDER BY ds ASC
    """)

    result = await db.execute(sql, {"series_pk": series_pk, "start_date": start_date})
    rows = result.fetchall()

    if not rows:
        return pd.DataFrame(columns=["ds", "y"])

    df = pd.DataFrame(rows, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].astype(float)
    return df


async def get_active_ingredients(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
) -> list[dict]:
    """
    Lấy danh sách nguyên liệu đang active tại chi nhánh, kèm series_id nếu đã có.

    Kết hợp dữ liệu từ inventory_balances + items + AiSeriesRegistry.
    series_id = None nếu nguyên liệu chưa được đăng ký trong registry (chưa train).

    Args:
        tenant_id: ID tenant (BẮT BUỘC filter)
        branch_id: ID chi nhánh

    Returns:
        List[dict] với keys: id, name, unit, series_id (str | None)
    """
    # Lấy tất cả series đã có trong registry cho branch này
    repo = SeriesRegistryRepo(db)
    registry_entries = await repo.get_all_by_branch(branch_id)
    # Map ingredient_id → series_id ("s{int}")
    series_map: dict[str, str] = {
        entry.ingredient_id: entry.series_id for entry in registry_entries
    }

    # Lấy danh sách nguyên liệu từ inventory_balances
    sql = text("""
        SELECT
            i.id::text   AS ingredient_id,
            i.name       AS name,
            i.unit       AS unit
        FROM inventory_balances ib
        JOIN items i ON i.id = ib.item_id
        WHERE ib.tenant_id = :tenant_id
          AND ib.branch_id = :branch_id
          AND i.type       = 'INGREDIENT'
          AND i.deleted_at IS NULL
        ORDER BY i.name ASC
    """)

    result = await db.execute(sql, {"tenant_id": tenant_id, "branch_id": branch_id})
    rows = result.fetchall()

    return [
        {
            "id": row.ingredient_id,
            "name": row.name,
            "unit": row.unit,
            "series_id": series_map.get(row.ingredient_id),  # None nếu chưa có
        }
        for row in rows
    ]


async def get_all_consumption_for_tenant(
    db: AsyncSession,
    tenant_id: str,
    days_back: int = 180,
) -> pd.DataFrame:
    """
    Lấy toàn bộ lịch sử tiêu thụ của tenant (tất cả branch × ingredient).

    Map series_id qua AiSeriesRegistry — dùng format "s{id}" nhất quán với predict.
    Kết quả dùng để train NeuralProphet Global Model.

    Args:
        tenant_id: ID tenant (BẮT BUỘC)
        days_back: Số ngày lịch sử cần lấy (mặc định 180 ngày)

    Returns:
        DataFrame với cột [ds (datetime64), y (float), ID (str "s{int}")]
        DataFrame rỗng nếu không có data
    """
    from app.repositories.series_registry_repo import SeriesRegistryRepo  # tránh circular

    start_date = date.today() - timedelta(days=days_back)

    # Lấy tất cả tiêu thụ của tenant (tất cả branch và ingredient)
    sql = text("""
        SELECT
            DATE(it.created_at)   AS ds,
            SUM(ABS(it.quantity)) AS y,
            it.item_id::text      AS ingredient_id,
            it.branch_id::text    AS branch_id
        FROM inventory_transactions it
        JOIN items i ON i.id = it.item_id
        WHERE it.tenant_id  = :tenant_id
          AND it.type       = 'SALE_DEDUCT'
          AND it.quantity   < 0
          AND it.created_at >= :start_date
          AND i.type        = 'INGREDIENT'
          AND i.deleted_at  IS NULL
        GROUP BY DATE(it.created_at), it.item_id, it.branch_id
        ORDER BY ds ASC
    """)

    result = await db.execute(sql, {"tenant_id": tenant_id, "start_date": start_date})
    rows = result.fetchall()

    if not rows:
        logger.warning(
            "Không có data tiêu thụ cho tenant %s trong %d ngày",
            tenant_id, days_back,
        )
        return pd.DataFrame(columns=["ds", "y", "ID"])

    df = pd.DataFrame(rows, columns=["ds", "y", "ingredient_id", "branch_id"])
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].astype(float)

    # Map (ingredient_id, branch_id) → series_id "s{int}" qua AiSeriesRegistry
    repo = SeriesRegistryRepo(db)
    pairs = df[["ingredient_id", "branch_id"]].drop_duplicates()
    series_map: dict[tuple[str, str], str] = {}

    for _, row in pairs.iterrows():
        key = (row["ingredient_id"], row["branch_id"])
        entry = await repo.get_or_create(
            ingredient_id=row["ingredient_id"],
            branch_id=row["branch_id"],
        )
        series_map[key] = entry.series_id  # "s{id}"

    df["ID"] = df.apply(
        lambda r: series_map[(r["ingredient_id"], r["branch_id"])], axis=1
    )
    df = df.drop(columns=["ingredient_id", "branch_id"])

    logger.info(
        "Consumption cho train: tenant=%s | %d rows | %d series",
        tenant_id, len(df), df["ID"].nunique(),
    )
    return df
