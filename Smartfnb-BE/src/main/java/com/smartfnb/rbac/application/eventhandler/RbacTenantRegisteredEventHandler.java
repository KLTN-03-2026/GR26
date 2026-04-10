package com.smartfnb.rbac.application.eventhandler;

import com.smartfnb.auth.domain.event.TenantRegisteredEvent;
import com.smartfnb.rbac.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Xử lý sự kiện TenantRegisteredEvent từ module Auth.
 * Khi một Tenant mới được tạo, tự động khởi tạo Role OWNER với TẤT CẢ các quyền hệ thống.
 * Gán Role OWNER đó cho user tạo Tenant.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RbacTenantRegisteredEventHandler {

    private final RoleJpaRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionJpaRepository rolePermissionRepository;
    private final UserRoleJpaRepository userRoleRepository;

    /**
     * Lắng nghe đồng bộ (synchronous) để đảm bảo Role OWNER được tạo ngay trong cùng transaction
     * của quá trình RegisterTenantCommandHandler.
     *
     * @param event sự kiện chứa thông tin Tenant mới.
     */
    @EventListener
    @Transactional
    public void onTenantRegistered(TenantRegisteredEvent event) {
        log.info("RBAC Module nhận sự kiện tạo Role OWNER cho tenantId={} (Đã được xử lý ở RegisterTenantCommandHandler)", event.tenantId());
        // Quá trình tạo Role OWNER và cấp quyền đã được gộp vào RegisterTenantCommandHandler
        // để có thể trả về JWT AccessToken với đầy đủ Permissions ngay lập tức ngay trong API Đăng ký.
        // Do đó, EventListener này không cần thực hiện insert Role nữa để tránh lỗi uq_role_name_tenant.
    }
}
