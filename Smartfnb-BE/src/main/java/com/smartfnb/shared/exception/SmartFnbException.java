package com.smartfnb.shared.exception;

import lombok.Getter;

/**
 * Exception gốc của toàn bộ hệ thống SmartF&B.
 * Tất cả các custom exception đều kế thừa class này.
 * Mỗi exception phải có errorCode dạng string để FE xử lý đa ngôn ngữ.
 *
 * <p>Ví dụ sử dụng:</p>
 * <pre>{@code
 *   throw new SmartFnbException("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng với id: " + orderId);
 * }</pre>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Getter
public class SmartFnbException extends RuntimeException {

    /**
     * Mã lỗi dạng snake_upper_case — FE dùng để hiển thị thông báo đa ngôn ngữ.
     * Ví dụ: ORDER_NOT_FOUND, TENANT_SUSPENDED, EMAIL_ALREADY_EXISTS
     */
    private final String errorCode;

    /**
     * HTTP status code tương ứng (mặc định 400 Bad Request).
     * Có thể override trong subclass.
     */
    private final int httpStatus;

    /**
     * Khởi tạo exception với mã lỗi và thông điệp, HTTP 400.
     *
     * @param errorCode mã lỗi (VD: ORDER_NOT_FOUND)
     * @param message   mô tả lỗi bằng tiếng Việt
     */
    public SmartFnbException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = 400;
    }

    /**
     * Khởi tạo exception với mã lỗi, thông điệp và HTTP status tùy chỉnh.
     *
     * @param errorCode  mã lỗi
     * @param message    mô tả lỗi
     * @param httpStatus HTTP status code (400, 404, 409, 422...)
     */
    public SmartFnbException(String errorCode, String message, int httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    /**
     * Khởi tạo exception với nguyên nhân gốc rễ (cause).
     *
     * @param errorCode mã lỗi
     * @param message   mô tả lỗi
     * @param cause     exception gốc
     */
    public SmartFnbException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = 400;
    }
}
