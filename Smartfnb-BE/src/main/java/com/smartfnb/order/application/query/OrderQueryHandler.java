package com.smartfnb.order.application.query;

import com.smartfnb.order.domain.model.Order;
import com.smartfnb.order.domain.repository.OrderRepository;
import com.smartfnb.order.infrastructure.persistence.OrderJpaEntity;
import com.smartfnb.order.infrastructure.persistence.OrderJpaRepository;
import com.smartfnb.order.infrastructure.persistence.TableJpaRepository;
import com.smartfnb.staff.infrastructure.persistence.StaffJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

/**
 * Xử lý các query liên quan đến đơn hàng.
 *
 * @author SmartF&B Team
 * @since 2026-03-31
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderQueryHandler {

    private final OrderJpaRepository orderJpaRepository;
    private final OrderRepository orderRepository;
    private final TableJpaRepository tableJpaRepository;
    private final StaffJpaRepository staffJpaRepository;

    /**
     * Lấy danh sách đơn hàng theo bộ lọc.
     * Chỉ trả về đơn trong scope tenant/branch của người dùng hiện tại.
     *
     * @param query query chứa tham số lọc
     * @return danh sách đơn hàng phân trang
     */
    public Page<OrderListResult> handle(GetOrderListQuery query) {
        log.info("Lấy danh sách đơn hàng: branch={}, status={}, from={}, to={}",
            query.branchId(), query.status(), query.from(), query.to());

        PageRequest pageRequest = PageRequest.of(
            query.page(),
            Math.min(query.size(), 100),
            Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<OrderJpaEntity> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), query.tenantId()));
            predicates.add(cb.equal(root.get("branchId"), query.branchId()));
            
            if (query.status() != null && !query.status().isBlank()) {
                predicates.add(cb.equal(root.get("status"), query.status()));
            }
            if (query.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), query.from().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()));
            }
            if (query.to() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), query.to().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()));
            }
            if (query.tableId() != null) {
                predicates.add(cb.equal(root.get("tableId"), query.tableId()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<OrderJpaEntity> orderPage = orderJpaRepository.findAll(spec, pageRequest);

        // Batch-lookup tên bàn và tên nhân viên để tránh N+1 query
        List<OrderJpaEntity> orders = orderPage.getContent();

        Set<UUID> tableIds = orders.stream()
            .filter(o -> o.getTableId() != null)
            .map(OrderJpaEntity::getTableId)
            .collect(Collectors.toSet());

        Set<UUID> userIds = orders.stream()
            .filter(o -> o.getUserId() != null)
            .map(OrderJpaEntity::getUserId)
            .collect(Collectors.toSet());

        Map<UUID, String> tableNameMap = tableIds.isEmpty() ? Map.of() :
            tableJpaRepository.findAllById(tableIds).stream()
                .collect(Collectors.toMap(
                    t -> t.getId(),
                    t -> t.getName()
                ));

        Map<UUID, String> staffNameMap = userIds.isEmpty() ? Map.of() :
            staffJpaRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                    s -> s.getId(),
                    s -> s.getFullName()
                ));

        return orderPage.map(entity -> toOrderListResult(entity, tableNameMap, staffNameMap));
    }

    /**
     * Lấy thông tin chi tiết đơn hàng theo ID.
     * Kiểm tra tenant và branch để đảm bảo phân quyền.
     *
     * @param query query chứa orderId và context
     * @return thông tin chi tiết đơn hàng
     */
    public Order handle(GetOrderByIdQuery query) {
        log.info("Lấy chi tiết đơn hàng: {}", query.orderId());

        return orderRepository.findByIdAndTenantIdAndBranchId(
                query.orderId(),
                query.tenantId(),
                query.branchId()
            )
            .orElseThrow(() -> {
                log.warn("Không tìm thấy đơn hàng {} hoặc không thuộc scope", query.orderId());
                return new com.smartfnb.order.domain.exception.OrderNotFoundException(query.orderId());
            });
    }

    private OrderListResult toOrderListResult(
            OrderJpaEntity entity,
            Map<UUID, String> tableNameMap,
            Map<UUID, String> staffNameMap) {

        String tableName = entity.getTableId() != null
            ? tableNameMap.getOrDefault(entity.getTableId(), "Bàn không xác định")
            : "Takeaway";

        String staffName = entity.getUserId() != null
            ? staffNameMap.getOrDefault(entity.getUserId(), "Nhân viên không xác định")
            : "Unknown";

        // Chuyển LocalDateTime thành Instant
        Instant createdAtInstant = entity.getCreatedAt() != null
            ? entity.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant()
            : Instant.now();

        return new OrderListResult(
            entity.getId(),
            entity.getOrderNumber(),
            entity.getTableId(),
            tableName,
            entity.getStatus(),
            entity.getTotalAmount(),
            createdAtInstant,
            staffName
        );
    }
}
