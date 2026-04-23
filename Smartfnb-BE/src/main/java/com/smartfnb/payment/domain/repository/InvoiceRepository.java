package com.smartfnb.payment.domain.repository;

import com.smartfnb.payment.domain.model.Invoice;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface cho Invoice Aggregate.
 * Định nghĩa các phương thức truy vấn mà infrastructure phải implement.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
public interface InvoiceRepository {
    /**
     * Lưu hoặc cập nhật Invoice.
     */
    Invoice save(Invoice invoice);

    /**
     * Tìm Invoice theo ID.
     */
    Optional<Invoice> findById(UUID id);

    /**
     * Tìm Invoice theo Order ID.
     */
    Optional<Invoice> findByOrderId(UUID orderId);

    /**
     * Tìm Invoice theo invoice number (unique).
     */
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    /**
     * Kiểm tra invoice_number đã tồn tại hay chưa.
     */
    boolean existsByInvoiceNumber(String invoiceNumber);
}
