package com.smartfnb.shared.web;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Response chuẩn cho toàn bộ API SmartF&B.
 * Format: { success, data, error, timestamp }
 *
 * <p>Sử dụng:</p>
 * <pre>{@code
 *   return ResponseEntity.ok(ApiResponse.ok(dto));
 *   return ResponseEntity.badRequest().body(ApiResponse.fail("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng"));
 * }</pre>
 *
 * @param <T> kiểu dữ liệu của trường data
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(

        /** true nếu request thành công, false nếu có lỗi */
        boolean success,

        /** Dữ liệu trả về khi thành công — null khi có lỗi */
        T data,

        /** Thông tin lỗi khi thất bại — null khi thành công */
        ErrorDetail error,

        /** Timestamp server xử lý request (epoch milliseconds) */
        long timestamp

) {

    /**
     * Thông tin chi tiết lỗi khi API thất bại.
     *
     * @param code    mã lỗi dạng snake_upper_case (VD: ORDER_NOT_FOUND)
     * @param message mô tả lỗi bằng tiếng Việt
     */
    public record ErrorDetail(String code, String message) {}

    /**
     * Tạo response thành công với data.
     * Tên "ok" để tránh conflict với record accessor "success()".
     *
     * @param data dữ liệu trả về
     * @return ApiResponse thành công
     */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, Instant.now().toEpochMilli());
    }

    /**
     * Tạo response thành công không có data (VD: cho DELETE endpoint).
     *
     * @return ApiResponse thành công không data
     */
    public static <T> ApiResponse<T> ok() {
        return new ApiResponse<>(true, null, null, Instant.now().toEpochMilli());
    }

    /**
     * Tạo response lỗi với mã lỗi và thông điệp.
     *
     * @param errorCode mã lỗi
     * @param message   thông điệp lỗi
     * @return ApiResponse lỗi
     */
    public static <T> ApiResponse<T> fail(String errorCode, String message) {
        return new ApiResponse<>(false, null, new ErrorDetail(errorCode, message), Instant.now().toEpochMilli());
    }
}
