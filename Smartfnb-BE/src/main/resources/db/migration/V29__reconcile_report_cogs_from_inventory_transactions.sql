-- V29__reconcile_report_cogs_from_inventory_transactions.sql
-- Author: Hoàng
-- Date: 2026-05-09
-- Note: Backfill COGS báo cáo doanh thu từ inventory ledger để sửa lỗi gross_profit = revenue khi cost_of_goods bị 0.

WITH cogs_by_branch_date AS (
    SELECT
        tenant_id,
        branch_id,
        DATE(created_at) AS report_date,
        SUM(ABS(quantity) * COALESCE(cost_per_unit, 0)) AS total_cost
    FROM inventory_transactions
    WHERE type = 'SALE_DEDUCT'
    GROUP BY tenant_id, branch_id, DATE(created_at)
)
UPDATE daily_revenue_summaries summary
SET
    cost_of_goods = cogs.total_cost,
    updated_at = CURRENT_TIMESTAMP
FROM cogs_by_branch_date cogs
WHERE summary.tenant_id = cogs.tenant_id
  AND summary.branch_id = cogs.branch_id
  AND summary.date = cogs.report_date
  AND summary.cost_of_goods IS DISTINCT FROM cogs.total_cost;

-- Không backfill daily_item_stats.cost trong migration này.
-- Lý do: inventory_transactions lưu nguyên liệu bị trừ, không lưu trực tiếp cost phân bổ theo order item.
-- Từ bản fix này trở đi, OrderCostCalculatedEvent mang itemCosts để daily_item_stats được cập nhật đúng tại runtime.
