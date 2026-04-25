package com.smartfnb.plan.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository JPA cho bảng subscription_invoices.
 * Cung cấp các truy vấn phục vụ module Admin Billing.
 *
 * @author vutq
 * @since 2026-04-24
 */
@Repository
public interface SubscriptionInvoiceJpaRepository extends JpaRepository<SubscriptionInvoiceJpaEntity, UUID> {

    /**
     * Lấy danh sách hóa đơn theo tenant, sắp xếp mới nhất trước.
     */
    Page<SubscriptionInvoiceJpaEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    /**
     * Đếm tổng số hóa đơn của một tenant.
     */
    long countByTenantId(UUID tenantId);

    /**
     * Lấy danh sách hóa đơn theo trạng thái (VD: UNPAID).
     */
    Page<SubscriptionInvoiceJpaEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Tra cứu hóa đơn theo mã số — trả Optional để handle not found.
     */
    Optional<SubscriptionInvoiceJpaEntity> findByInvoiceNumber(String invoiceNumber);

    /**
     * Kiểm tra subscription đã có hóa đơn UNPAID chưa (tránh tạo trùng).
     */
    boolean existsBySubscriptionIdAndStatus(UUID subscriptionId, String status);

    /**
     * Lấy số hóa đơn mới nhất trong tháng để sinh invoice_number tăng dần.
     * Ví dụ: tìm số đếm lớn nhất của prefix "INV-202604-".
     */
    long countByInvoiceNumberStartingWith(String prefix);
}
