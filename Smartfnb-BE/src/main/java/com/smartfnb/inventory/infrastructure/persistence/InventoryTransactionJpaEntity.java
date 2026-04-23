package com.smartfnb.inventory.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity đại diện cho bảng inventory_transactions.
 * Ghi lịch sử mọi biến động kho: IMPORT, SALE_DEDUCT, WASTE, ADJUSTMENT.
 * Đây là audit trail bất biến — không được sửa sau khi tạo.
 *
 * @author SmartF&B Team
 * @since 2026-04-03
 */
@Entity
@Table(
    name = "inventory_transactions",
    indexes = {
        @Index(name = "idx_inv_trans_branch_item", columnList = "branch_id, item_id, created_at DESC"),
        @Index(name = "idx_inv_trans_type",        columnList = "branch_id, type, created_at DESC"),
        @Index(name = "idx_inv_trans_tenant",       columnList = "tenant_id, created_at DESC")
    }
)
@Getter
@Setter(AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryTransactionJpaEntity {

    /** Khóa chính UUID */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Tenant sở hữu */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /** Chi nhánh phát sinh giao dịch */
    @Column(name = "branch_id", nullable = false, updatable = false)
    private UUID branchId;

    /** Nguyên liệu */
    @Column(name = "item_id", nullable = false, updatable = false)
    private UUID itemId;

    /** Nhân viên thực hiện */
    @Column(name = "user_id", updatable = false)
    private UUID userId;

    /** Batch liên quan (IMPORT hoặc SALE_DEDUCT) */
    @Column(name = "batch_id", updatable = false)
    private UUID batchId;

    /**
     * Loại giao dịch:
     * IMPORT = nhập kho mới, SALE_DEDUCT = xuất bán,
     * WASTE = hao hụt, ADJUSTMENT = điều chỉnh thủ công
     */
    @Column(name = "type", nullable = false, updatable = false, length = 20)
    private String type;

    /**
     * Số lượng thay đổi.
     * Dương (+): nhập thêm vào kho.
     * Âm (-): xuất/trừ khỏi kho.
     */
    @Column(name = "quantity", nullable = false, updatable = false, precision = 10, scale = 4)
    private BigDecimal quantity;

    /** Đơn giá (tại thời điểm giao dịch) */
    @Column(name = "cost_per_unit", updatable = false, precision = 12, scale = 4)
    private BigDecimal costPerUnit;

    /** ID tham chiếu (orderId, purchaseOrderId...) */
    @Column(name = "reference_id", updatable = false)
    private UUID referenceId;

    /** Loại tham chiếu: ORDER | MANUAL */
    @Column(name = "reference_type", updatable = false, length = 30)
    private String referenceType;

    /** Ghi chú lý do */
    @Column(name = "note", updatable = false, length = 500)
    private String note;

    /** Thời điểm giao dịch — bất biến */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method tạo giao dịch nhập kho.
     */
    public static InventoryTransactionJpaEntity forImport(UUID tenantId, UUID branchId,
                                                           UUID itemId, UUID userId,
                                                           UUID batchId, BigDecimal quantity,
                                                           BigDecimal costPerUnit, String note) {
        InventoryTransactionJpaEntity tx = new InventoryTransactionJpaEntity();
        tx.tenantId = tenantId;
        tx.branchId = branchId;
        tx.itemId = itemId;
        tx.userId = userId;
        tx.batchId = batchId;
        tx.type = "IMPORT";
        tx.quantity = quantity;
        tx.costPerUnit = costPerUnit;
        tx.referenceType = "MANUAL";
        tx.note = note;
        tx.createdAt = Instant.now();
        return tx;
    }

    /**
     * Factory method tạo giao dịch xuất kho FIFO chung.
     * Sử dụng cho cả SALE_DEDUCT (xuất bán) và PRODUCTION_OUT (xuất sản xuất).
     *
     * @param transactionType SALE_DEDUCT | PRODUCTION_OUT
     * @param referenceType   ORDER | PRODUCTION
     * @param userId          ID người thực hiện (nếu có, null cho system)
     */
    public static InventoryTransactionJpaEntity forFifoDeduct(UUID tenantId, UUID branchId,
                                                               UUID itemId, UUID batchId,
                                                               BigDecimal quantity,
                                                               BigDecimal costPerUnit,
                                                               String transactionType,
                                                               UUID referenceId,
                                                               String referenceType,
                                                               UUID userId) {
        InventoryTransactionJpaEntity tx = new InventoryTransactionJpaEntity();
        tx.tenantId = tenantId;
        tx.branchId = branchId;
        tx.itemId = itemId;
        tx.batchId = batchId;
        tx.type = transactionType;
        tx.quantity = quantity.negate();          // Số âm = xuất kho
        tx.costPerUnit = costPerUnit;
        tx.referenceId = referenceId;
        tx.referenceType = referenceType;
        tx.userId = userId;
        tx.createdAt = Instant.now();
        return tx;
    }

    /**
     * Factory method tạo giao dịch ghi nhận hao hụt.
     */
    public static InventoryTransactionJpaEntity forWaste(UUID tenantId, UUID branchId,
                                                          UUID itemId, UUID userId,
                                                          BigDecimal quantity, String note) {
        InventoryTransactionJpaEntity tx = new InventoryTransactionJpaEntity();
        tx.tenantId = tenantId;
        tx.branchId = branchId;
        tx.itemId = itemId;
        tx.userId = userId;
        tx.type = "WASTE";
        tx.quantity = quantity.negate();          // Số âm = giảm kho
        tx.referenceType = "MANUAL";
        tx.note = note;
        tx.createdAt = Instant.now();
        return tx;
    }

    /**
     * Factory method tạo giao dịch điều chỉnh kho thủ công.
     * quantity có thể dương hoặc âm tùy chiều điều chỉnh.
     */
    public static InventoryTransactionJpaEntity forAdjustment(UUID tenantId, UUID branchId,
                                                               UUID itemId, UUID userId,
                                                               BigDecimal quantity, String note) {
        InventoryTransactionJpaEntity tx = new InventoryTransactionJpaEntity();
        tx.tenantId = tenantId;
        tx.branchId = branchId;
        tx.itemId = itemId;
        tx.userId = userId;
        tx.type = "ADJUSTMENT";
        tx.quantity = quantity;
        tx.referenceType = "MANUAL";
        tx.note = note;
        tx.createdAt = Instant.now();
        return tx;
    }

    /**
     * Factory method tạo giao dịch nhập kho bán thành phẩm do sản xuất (PRODUCTION_IN).
     * Ghi nhận khi một mẻ sản xuất hoàn tất — actualOutput được cộng vào tồn kho.
     *
     * @param tenantId        ID tenant
     * @param branchId        ID chi nhánh
     * @param subAssemblyId   ID bán thành phẩm đầu ra
     * @param producedBy      ID nhân viên thực hiện
     * @param actualOutput    Sản lượng thực tế (dương — nhập vào kho)
     * @param note            Ghi chú mẻ sản xuất
     * @param referenceId     ID của mẻ sản xuất (ProductionBatch ID)
     * @return entity transaction
     */
    public static InventoryTransactionJpaEntity forProductionIn(UUID tenantId, UUID branchId,
                                                                 UUID subAssemblyId, UUID producedBy,
                                                                 BigDecimal actualOutput, String note,
                                                                 UUID referenceId) {
        InventoryTransactionJpaEntity tx = new InventoryTransactionJpaEntity();
        tx.tenantId = tenantId;
        tx.branchId = branchId;
        tx.itemId = subAssemblyId;
        tx.userId = producedBy;
        tx.type = "PRODUCTION_IN";
        tx.quantity = actualOutput;          // Số dương = nhập kho
        tx.referenceId = referenceId;
        tx.referenceType = "PRODUCTION";
        tx.note = note;
        tx.createdAt = Instant.now();
        return tx;
    }
}
