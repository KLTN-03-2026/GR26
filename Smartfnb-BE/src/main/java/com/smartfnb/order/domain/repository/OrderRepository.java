package com.smartfnb.order.domain.repository;

import com.smartfnb.order.domain.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository {
    Order save(Order order);
    
    Optional<Order> findByIdAndTenantId(UUID id, UUID tenantId);
    
    Optional<Order> findByIdAndTenantIdAndBranchId(UUID id, UUID tenantId, UUID branchId);
    
    Page<Order> findByTenantIdAndBranchId(UUID tenantId, UUID branchId, Pageable pageable);
}
