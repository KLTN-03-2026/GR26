-- ============================================================================
-- V18__report_module.sql
-- Tạo bảng báo cáo: daily_revenue_summaries, daily_item_stats, hourly_revenue_stats
-- Thêm permissions: REPORT_REVENUE, REPORT_INVENTORY, REPORT_HR
-- ============================================================================

-- Bảng daily_revenue_summaries: Tổng hợp doanh thu hàng ngày
-- ALREADY EXISTS in V1__init_schema.sql, so we don't need to recreate
-- But we'll add any missing indexes or tweaks here

-- Verify: Kiểm tra index tồn tại
-- CREATE INDEX IF NOT EXISTS idx_daily_rev_branch_date ON daily_revenue_summaries(branch_id, date DESC);
-- CREATE INDEX IF NOT EXISTS idx_daily_rev_tenant_date ON daily_revenue_summaries(tenant_id, date DESC);

-- Bảng hourly_revenue_stats: ALREADY EXISTS
-- CREATE INDEX IF NOT EXISTS idx_hourly_branch_date ON hourly_revenue_stats(branch_id, date DESC);

-- Bảng daily_item_stats: ALREADY EXISTS
-- CREATE INDEX IF NOT EXISTS idx_item_stats_branch_date ON daily_item_stats(branch_id, date DESC);

-- ============================================================================
-- Thêm permissions mới cho Report Module (nếu chưa có)
-- ============================================================================

INSERT INTO permissions (id, module, description) VALUES
('REPORT_REVENUE',      'REPORT',       'Xem báo cáo doanh thu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO permissions (id, module, description) VALUES
('REPORT_INVENTORY',    'REPORT',       'Xem báo cáo kho nguyên liệu'),
('REPORT_HR',           'REPORT',       'Xem báo cáo nhân sự'),
('REPORT_PROMOTION',    'REPORT',       'Xem báo cáo khuyến mãi'),
('REPORT_EXPORT',       'REPORT',       'Xuất báo cáo ra CSV/Excel')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed default roles nếu chưa có
-- Các role mặc định cho tenant mới
-- ============================================================================

-- Note: Roles được tạo dynamic per-tenant, không seed ở đây
-- Nhưng có thể seed các role templates nếu cần

COMMIT;
