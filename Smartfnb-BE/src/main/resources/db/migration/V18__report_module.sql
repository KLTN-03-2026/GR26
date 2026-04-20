-- ============================================================================
-- V18__report_module.sql
-- Tạo bảng báo cáo: daily_revenue_summaries, daily_item_stats, hourly_revenue_stats
-- Thêm permissions: REPORT_REVENUE, REPORT_INVENTORY, REPORT_HR
-- ============================================================================

-- Bảng daily_revenue_summaries: Tổng hợp doanh thu hàng ngày
CREATE TABLE IF NOT EXISTS daily_revenue_summaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    total_revenue   DECIMAL(12,2) DEFAULT 0,
    total_orders    INT DEFAULT 0,
    avg_order_value DECIMAL(12,2) DEFAULT 0,
    payment_breakdown JSONB DEFAULT '{}',
    cost_of_goods   DECIMAL(12,2) DEFAULT 0,
    gross_profit    DECIMAL(12,2)
        GENERATED ALWAYS AS (total_revenue - cost_of_goods) STORED,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_daily_rev_branch_date UNIQUE (branch_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_rev_branch_date ON daily_revenue_summaries(branch_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_rev_tenant_date ON daily_revenue_summaries(tenant_id, date DESC);

-- Bảng hourly_revenue_stats: Thống kê doanh thu theo giờ (heatmap)
CREATE TABLE IF NOT EXISTS hourly_revenue_stats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID REFERENCES branches(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    hour            SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
    order_count     INT DEFAULT 0,
    revenue         DECIMAL(12,2) DEFAULT 0,
    CONSTRAINT uq_hourly_branch_date_hour UNIQUE (branch_id, date, hour)
);

CREATE INDEX IF NOT EXISTS idx_hourly_branch_date ON hourly_revenue_stats(branch_id, date DESC);

-- Bảng daily_item_stats: Hiệu suất từng món theo ngày
CREATE TABLE IF NOT EXISTS daily_item_stats (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID REFERENCES tenants(id)  ON DELETE CASCADE,
    branch_id   UUID REFERENCES branches(id) ON DELETE CASCADE,
    item_id     UUID REFERENCES items(id)    ON DELETE CASCADE,
    item_name   VARCHAR(255),
    date        DATE NOT NULL,
    qty_sold    INT DEFAULT 0,
    revenue     DECIMAL(12,2) DEFAULT 0,
    cost        DECIMAL(12,2) DEFAULT 0,
    gross_margin DECIMAL(5,2)
        GENERATED ALWAYS AS (
            CASE WHEN revenue > 0 THEN (revenue - cost) / revenue * 100 ELSE 0 END
        ) STORED,
    CONSTRAINT uq_item_stat_branch_date UNIQUE (branch_id, item_id, date)
);

CREATE INDEX IF NOT EXISTS idx_item_stats_branch_date ON daily_item_stats(branch_id, date DESC);

-- ============================================================================
-- Thêm permissions mới cho Report Module
-- ============================================================================

INSERT INTO permissions (id, module, description) VALUES
('REPORT_REVENUE',      'REPORT',       'Xem báo cáo doanh thu'),
('REPORT_INVENTORY',    'REPORT',       'Xem báo cáo kho nguyên liệu'),
('REPORT_HR',           'REPORT',       'Xem báo cáo nhân sự'),
('REPORT_PROMOTION',    'REPORT',       'Xem báo cáo khuyến mãi'),
('REPORT_EXPORT',       'REPORT',       'Xuất báo cáo ra CSV/Excel')
ON CONFLICT (id) DO NOTHING;
