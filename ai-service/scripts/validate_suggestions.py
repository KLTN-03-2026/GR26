"""
Validate Suggestions — Script xác thực gợi ý nhập kho bằng mắt.

Chạy: python scripts/validate_suggestions.py <tenant_id> <branch_id>

In ra bảng so sánh để kiểm tra tính hợp lý của:
- Tồn kho vs min_stock vs usable_stock
- Ngày hết hàng dự kiến
- Ngày đặt hàng gợi ý
- Số lượng gợi ý nhập

Không sửa DB — chỉ đọc và in.
"""

import asyncio
import sys
from pathlib import Path

# Thêm root vào sys.path để import app.*
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


async def validate_suggestions(tenant_id: str, branch_id: str) -> None:
    """
    In bảng xác thực kết quả dự báo kho cho branch.

    Đọc từ bảng forecast_results + ingredients, in ra bảng để kiểm tra thủ công.

    Args:
        tenant_id: ID tenant cần xác thực
        branch_id: ID chi nhánh cần xác thực
    """
    from sqlalchemy import text

    from app.core.database import SessionLocal

    async with SessionLocal() as db:
        # Lấy kết quả forecast từ DB kèm thông tin nguyên liệu
        result = await db.execute(
            text("""
                SELECT
                    i.name                              AS name,
                    i.unit                              AS unit,
                    ib.quantity                         AS current_stock,
                    COALESCE(ib.min_stock, 0.0)         AS min_stock,
                    MIN(fr.stockout_date)               AS stockout_date,
                    MAX(fr.suggested_qty)               AS suggested_order_qty,
                    MIN(fr.forecast_date)               AS suggested_order_date,
                    -- Tính tổng 7 ngày forecast để so sánh thủ công
                    ROUND(CAST(SUM(fr.predicted_qty) AS numeric), 2) AS total_7day_forecast,
                    ROUND(CAST(SUM(fr.predicted_qty) * 1.2 AS numeric), 2) AS qty_check_manual
                FROM forecast_results fr
                JOIN ai_series_registry sr ON sr.id = fr.series_id
                JOIN items i ON i.id = sr.ingredient_id::uuid
                JOIN inventory_balances ib
                    ON ib.item_id = sr.ingredient_id::uuid
                   AND ib.branch_id = sr.branch_id::uuid
                WHERE sr.branch_id = :branch_id
                  AND ib.tenant_id = :tenant_id
                  AND fr.forecast_date >= CURRENT_DATE
                GROUP BY i.name, i.unit, ib.quantity, ib.min_stock
                ORDER BY stockout_date ASC NULLS LAST, i.name ASC
            """),
            {"branch_id": branch_id, "tenant_id": tenant_id},
        )
        rows = result.fetchall()

    if not rows:
        print(f"\nKhông có dữ liệu forecast cho branch={branch_id}, tenant={tenant_id}")
        print("Hãy chạy predict_branch() trước.")
        return

    # ── In bảng ────────────────────────────────────────────────────────────────
    W = 110
    print(f"\n{'=' * W}")
    print(f"XÁC THỰC DỰ BÁO KHO — Tenant: {tenant_id} | Branch: {branch_id}")
    print(f"{'=' * W}")
    print(
        f"{'Nguyên liệu':<22}"
        f"{'Tồn kho':>10}"
        f"{'Min':>8}"
        f"{'Dùng được':>11}"
        f"{'Hết ngày':>13}"
        f"{'Gợi ý nhập':>13}"
        f"{'Tổng 7 ngày':>13}"
        f"{'×1.2 check':>12}"
    )
    print(f"{'-' * W}")

    for row in rows:
        usable = float(row.current_stock) - float(row.min_stock)
        stockout_str = str(row.stockout_date) if row.stockout_date else "N/A (đủ lâu)"
        print(
            f"{str(row.name):<22}"
            f"{float(row.current_stock):>8.1f}{str(row.unit):>3}"
            f"{float(row.min_stock):>7.0f}"
            f"{usable:>10.1f}"
            f"{stockout_str:>13}"
            f"{float(row.suggested_order_qty):>11.2f}{str(row.unit):>3}"
            f"{float(row.total_7day_forecast):>11.2f}{str(row.unit):>3}"
            f"{float(row.qty_check_manual):>10.2f}{str(row.unit):>3}"
        )

    print(f"{'=' * W}")
    print("\nHƯỚNG DẪN XÁC THỰC TAY:")
    print("  1. Cột 'Dùng được' = Tồn kho - Min stock")
    print("  2. 'Hết ngày' = hôm nay + (Dùng được / tiêu thụ tb/ngày)")
    print("  3. 'Gợi ý nhập' nên gần với '×1.2 check' (tổng 7 ngày × 1.2 - tồn kho)")
    print("  4. Nếu 'Hết ngày' = N/A → tồn kho đủ dùng vượt 7 ngày forecast window\n")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Cách dùng: python scripts/validate_suggestions.py <tenant_id> <branch_id>")
        sys.exit(1)

    asyncio.run(validate_suggestions(sys.argv[1], sys.argv[2]))
