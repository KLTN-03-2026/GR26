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
from uuid import UUID

import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

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
