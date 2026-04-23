package com.smartfnb.shared.web;

import java.util.List;

/**
 * Response cho danh sách phân trang — dùng thay thế Page<T> của Spring Data.
 * Tránh expose implementation details của Pageable ra ngoài API.
 *
 * @param <T> kiểu dữ liệu mỗi phần tử trong danh sách
 * @author SmartF&B Team
 * @since 2026-03-26
 */
public record PageResponse<T>(

        /** Danh sách phần tử trong trang hiện tại */
        List<T> content,

        /** Số trang hiện tại (0-indexed) */
        int page,

        /** Kích thước trang (số phần tử tối đa mỗi trang) */
        int size,

        /** Tổng số phần tử trong toàn bộ kết quả */
        long totalElements,

        /** Tổng số trang */
        int totalPages

) {

    /**
     * Tạo PageResponse từ Spring Data Page object.
     *
     * @param content       danh sách items trang hiện tại
     * @param page          số trang (0-indexed)
     * @param size          kích thước trang
     * @param totalElements tổng số items
     * @return PageResponse được đóng gói
     */
    public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new PageResponse<>(content, page, size, totalElements, totalPages);
    }

    /**
     * Tạo PageResponse từ Spring Data Page — tiện lợi nhất khi dùng JPA.
     *
     * @param springPage Spring Data Page object
     * @return PageResponse tương ứng
     */
    public static <T> PageResponse<T> from(org.springframework.data.domain.Page<T> springPage) {
        return new PageResponse<>(
                springPage.getContent(),
                springPage.getNumber(),
                springPage.getSize(),
                springPage.getTotalElements(),
                springPage.getTotalPages()
        );
    }
}
