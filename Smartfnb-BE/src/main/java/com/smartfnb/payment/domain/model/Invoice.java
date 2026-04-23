package com.smartfnb.payment.domain.model;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root đại diện cho Hóa đơn.
 * Immutable sau khi tạo — không được sửa, chỉ có thể hoàn tiền.
 * invoice_number là duy nhất và bất biến.
 *
 * @author SmartF&B Team
 * @since 2026-04-01
 */
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Invoice {
    private UUID id;
    private UUID tenantId;
    private UUID branchId;
    private UUID orderId;
    private UUID paymentId;
    private String invoiceNumber;        // Duy nhất, bất biến
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private Instant issuedAt;
    private List<InvoiceItem> items = new ArrayList<>();

    /**
     * Tạo Invoice mới từ Order & Payment.
     * invoiceNumber là duy nhất và sinh ra tự động.
     */
    public static Invoice create(
            UUID tenantId, UUID branchId, UUID orderId, UUID paymentId,
            String generatedInvoiceNumber,
            BigDecimal subtotal, BigDecimal discount, BigDecimal taxAmount,
            BigDecimal total, List<InvoiceItem> items) {

        Invoice invoice = new Invoice();
        invoice.id = UUID.randomUUID();
        invoice.tenantId = tenantId;
        invoice.branchId = branchId;
        invoice.orderId = orderId;
        invoice.paymentId = paymentId;
        invoice.invoiceNumber = generatedInvoiceNumber;
        invoice.subtotal = subtotal;
        invoice.discount = discount;
        invoice.taxAmount = taxAmount;
        invoice.total = total;
        invoice.issuedAt = Instant.now();
        invoice.items = items != null ? items : new ArrayList<>();

        return invoice;
    }

    /**
     * Reconstruct Invoice từ JPA entity (sau khi load từ database).
     */
    public static Invoice reconstruct(
            UUID id, UUID tenantId, UUID branchId, UUID orderId, UUID paymentId,
            String invoiceNumber, BigDecimal subtotal, BigDecimal discount,
            BigDecimal taxAmount, BigDecimal total, Instant issuedAt, List<InvoiceItem> items) {
        Invoice invoice = new Invoice();
        invoice.id = id;
        invoice.tenantId = tenantId;
        invoice.branchId = branchId;
        invoice.orderId = orderId;
        invoice.paymentId = paymentId;
        invoice.invoiceNumber = invoiceNumber;
        invoice.subtotal = subtotal;
        invoice.discount = discount;
        invoice.taxAmount = taxAmount;
        invoice.total = total;
        invoice.issuedAt = issuedAt;
        invoice.items = items != null ? items : new ArrayList<>();
        return invoice;
    }

    /**
     * Kiểm tra Invoice đã được phát hành hay không.
     */
    public boolean isIssued() {
        return this.issuedAt != null;
    }
}
