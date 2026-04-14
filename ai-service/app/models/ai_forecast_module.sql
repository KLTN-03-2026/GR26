-- ==============================================================================
-- V13: AI Forecast Module — Bảng kết quả dự báo và log train
-- Ghi bởi: AI Service Python (port 8001)
-- Đọc bởi: BE Spring Boot (khi FE request /api/forecast)
-- ==============================================================================

-- Kết quả dự báo tiêu thụ nguyên liệu 7 ngày tới
-- AI Service upsert vào bảng này mỗi đêm lúc 00:30
CREATE TABLE forecast_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id)  ON DELETE CASCADE,
    ingredient_id   UUID NOT NULL REFERENCES items(id)     ON DELETE CASCADE,

    -- Ngày được dự báo (không phải ngày chạy predict job)
    forecast_date   DATE NOT NULL,

    -- Tiêu thụ dự kiến trong ngày forecast_date (đơn vị theo items.unit)
    predicted_qty   DECIMAL(10,4) NOT NULL CHECK (predicted_qty >= 0),

    -- Ngày dự kiến hết hàng dựa trên inventory_balances.quantity hiện tại
    -- NULL = tồn kho đủ dùng trong toàn kỳ dự báo 7 ngày
    stockout_date   DATE,

    -- Số lượng gợi ý nhập để đủ dùng (bao gồm safety factor 20%)
    suggested_qty   DECIMAL(10,4),

    -- Thời điểm predict job chạy và ghi kết quả này
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Không duplicate kết quả cho cùng nguyên liệu × chi nhánh × ngày
    CONSTRAINT uq_forecast_branch_ingredient_date
        UNIQUE (branch_id, ingredient_id, forecast_date)
);

-- Index hỗ trợ BE query nhanh theo branch + ngày (API chính)
CREATE INDEX idx_forecast_branch_date
    ON forecast_results(branch_id, forecast_date DESC);

-- Index cho AI Service cleanup kết quả cũ (xóa dữ liệu > 30 ngày)
CREATE INDEX idx_forecast_tenant_created
    ON forecast_results(tenant_id, created_at DESC);

COMMENT ON TABLE forecast_results IS
    'Kết quả dự báo tiêu thụ nguyên liệu — ghi bởi AI Service, đọc bởi BE/FE';
COMMENT ON COLUMN forecast_results.forecast_date IS
    'Ngày được dự báo, không phải ngày chạy job';
COMMENT ON COLUMN forecast_results.stockout_date IS
    'NULL = tồn kho đủ trong 7 ngày tới';
COMMENT ON COLUMN forecast_results.suggested_qty IS
    'Tổng tiêu thụ dự báo × safety factor 1.2';


-- Log quá trình train model NeuralProphet
-- Ghi sau mỗi lần chạy train job (thành công hoặc thất bại)
CREATE TABLE train_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    started_at      TIMESTAMP NOT NULL,
    finished_at     TIMESTAMP,

    -- running | success | failed
    status          VARCHAR(20) NOT NULL DEFAULT 'running'
                    CONSTRAINT ck_train_status CHECK (status IN ('running', 'success', 'failed')),

    -- Số lượng series (ingredient × branch) đã train trong lần này
    series_count    INT,

    -- Mean Absolute Error trên validation set — metric đánh giá chất lượng model
    mae             DECIMAL(10,4),

    -- Stack trace hoặc mô tả lỗi nếu status = failed
    error_message   TEXT,

    -- Trigger: manual (do Owner/Admin bấm) | scheduled (cron Chủ nhật 2h)
    trigger_type    VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                    CONSTRAINT ck_train_trigger CHECK (trigger_type IN ('manual', 'scheduled')),

    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index xem log gần nhất theo tenant
CREATE INDEX idx_train_logs_tenant_started
    ON train_logs(tenant_id, started_at DESC);

COMMENT ON TABLE train_logs IS
    'Log kết quả mỗi lần chạy train job NeuralProphet — dùng để monitor và alert';
COMMENT ON COLUMN train_logs.mae IS
    'Mean Absolute Error — càng thấp model càng chính xác';
COMMENT ON COLUMN train_logs.trigger_type IS
    'manual = Owner bấm tay | scheduled = cron tự động';


