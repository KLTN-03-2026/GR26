package com.smartfnb.staff.application.query;

import java.util.UUID;

/**
 * Query lấy danh sách nhân viên trong tenant/chi nhánh.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
public record GetStaffListQuery(
        /** UUID tenant — lấy từ TenantContext */
        UUID tenantId,
        /** Lọc theo chức vụ (nullable) */
        UUID positionId,
        /** Lọc theo trạng thái: ACTIVE | INACTIVE (nullable = tất cả) */
        String status,
        /** Tìm kiếm theo tên hoặc số điện thoại (nullable) */
        String keyword,
        /** Trang hiện tại (0-indexed) */
        int page,
        /** Kích thước trang (tối đa 100) */
        int size
) {}
