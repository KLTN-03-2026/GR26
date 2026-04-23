package com.smartfnb.expense.application.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO request cho tạo/cập nhật Hóa đơn chi (Expense).
 * 
 * @author vutq
 * @since 2026-04-17
 */
public record ExpenseRequest(
    @NotNull(message = "Số tiền không được để trống")
    @Positive(message = "Số tiền phải lớn hơn 0")
    BigDecimal amount,

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục không vượt quá 100 ký tự")
    String categoryName,

    @Size(max = 500, message = "Mô tả không vượt quá 500 ký tự")
    String description,

    @NotNull(message = "Ngày chi không được để trống")
    Instant expenseDate,

    @NotBlank(message = "Phương thức chi không được để trống")
    @Pattern(regexp = "^(CASH|TRANSFER|QR_CODE)$", 
             message = "Phương thức chi phải là CASH, TRANSFER hoặc QR_CODE")
    String paymentMethod
) {}
