-- =================================================================
-- V24: Branch Payment Config (PayOS per-branch setup)
-- =================================================================
-- author: Hoàng
-- date: 27-04-2026
-- note: Lưu cấu hình cổng thanh toán PayOS cho từng chi nhánh.
--       apiKey và checksumKey được mã hoá AES-256 trước khi lưu.
-- =================================================================

CREATE TABLE branch_payment_configs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id               UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    tenant_id               UUID NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,

    -- Thông tin xác thực PayOS (apiKey và checksumKey được mã hoá)
    client_id               VARCHAR(255) NOT NULL,
    api_key_encrypted       TEXT         NOT NULL,
    checksum_key_encrypted  TEXT         NOT NULL,

    is_active               BOOLEAN NOT NULL DEFAULT TRUE,

    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Mỗi chi nhánh chỉ có một bộ cấu hình PayOS
    CONSTRAINT uq_branch_payment_config UNIQUE (branch_id, tenant_id)
);

CREATE INDEX idx_branch_payment_configs_branch ON branch_payment_configs(branch_id);
CREATE INDEX idx_branch_payment_configs_tenant ON branch_payment_configs(tenant_id);
