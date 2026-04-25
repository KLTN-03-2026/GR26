package com.smartfnb.expense.domain.model;

/**
 * Trạng thái của Hóa đơn chi.
 * Sử dụng soft delete (deleted flag) thay vì CANCELLED status.
 * 
 * @author vutq
 * @since 2026-04-17
 */
public enum ExpenseStatus {
    /**
     * Hoàn thành - phiếu chi đã được tạo và ghi nhận.
     * Khi xóa mềm, không xóa record mà set deleted = true.
     */
    COMPLETED
}
