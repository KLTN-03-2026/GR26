package com.smartfnb.inventory.application.query;

import java.util.UUID;

/**
 * Query lấy danh sách tồn kho theo chi nhánh.
 * OWNER có thể truyền branchId=null để xem tất cả chi nhánh trong tenant.
 *
 * @param tenantId UUID tenant (từ JWT — bắt buộc)
 * @param branchId UUID chi nhánh (null = tất cả, chỉ OWNER)
 * @param page     trang hiện tại (0-indexed)
 * @param size     số phần tử mỗi trang (tối đa 100)
 *
 * @author vutq
 * @since 2026-04-03
 */
public record GetInventoryQuery(
    UUID tenantId,
    UUID branchId,
    int page,
    int size
) {}
