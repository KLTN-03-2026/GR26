package com.smartfnb.plan.application.dto;

import java.util.List;

/**
 * Response phân trang cho danh sách gói dịch vụ.
 * Dùng cho GET /api/v1/admin/plans?page=&size=.
 *
 * @param content      danh sách gói trong trang hiện tại
 * @param page         số trang hiện tại (0-indexed)
 * @param size         kích thước trang
 * @param totalPages   tổng số trang
 * @param totalElements tổng số phần tử
 *
 * @author vutq
 * @since 2026-04-24
 */
public record PlanPageResponse(
        List<PlanResponse> content,
        int page,
        int size,
        int totalPages,
        long totalElements
) {}
