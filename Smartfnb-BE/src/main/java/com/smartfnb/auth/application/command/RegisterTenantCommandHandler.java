package com.smartfnb.auth.application.command;

import com.smartfnb.auth.application.dto.AuthResponse;
import com.smartfnb.auth.infrastructure.jwt.JwtService;
import com.smartfnb.auth.infrastructure.persistence.PlanRepository;
import com.smartfnb.auth.infrastructure.persistence.TenantJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.TenantRepository;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.rbac.infrastructure.persistence.PermissionJpaEntity;
import com.smartfnb.rbac.infrastructure.persistence.RoleJpaEntity;
import com.smartfnb.rbac.infrastructure.persistence.RoleJpaRepository;
import com.smartfnb.rbac.infrastructure.persistence.UserRoleJpaEntity;
import com.smartfnb.rbac.infrastructure.persistence.UserRoleJpaRepository;
import com.smartfnb.rbac.infrastructure.persistence.RolePermissionJpaEntity;
import com.smartfnb.rbac.infrastructure.persistence.RolePermissionJpaRepository;
import com.smartfnb.rbac.infrastructure.persistence.PermissionRepository;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Xử lý lệnh đăng ký tenant mới (chủ quán tạo tài khoản SaaS).
 *
 * <p>Flow nghiệp vụ:</p>
 * <ol>
 *   <li>Validate email chưa tồn tại trên toàn hệ thống</li>
 *   <li>Tìm gói dịch vụ theo planSlug</li>
 *   <li>Tạo Tenant với thông tin F&B</li>
 *   <li>Tạo User owner với mật khẩu đã hash BCrypt</li>
 *   <li>Gán role OWNER cho user</li>
 *   <li>Tạo và trả JWT ngay (không cần đăng nhập lại)</li>
 * </ol>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegisterTenantCommandHandler {

    private final TenantRepository        tenantRepository;
    private final UserRepository           userRepository;
    private final PlanRepository           planRepository;
    private final PasswordEncoder          passwordEncoder;
    private final JwtService               jwtService;
    private final ApplicationEventPublisher eventPublisher;
    private final PermissionRepository           permissionRepository;
    private final RoleJpaRepository              roleJpaRepository;
    private final UserRoleJpaRepository          userRoleJpaRepository;
    private final RolePermissionJpaRepository    rolePermissionJpaRepository;

    /**
     * Thực thi đăng ký tenant mới.
     * Toàn bộ được bọc trong transaction — rollback nếu bất kỳ bước nào thất bại.
     *
     * @param command lệnh đăng ký từ controller
     * @return AuthResponse chứa JWT access token và refresh token
     * @throws SmartFnbException EMAIL_ALREADY_EXISTS nếu email đã được sử dụng
     * @throws SmartFnbException PLAN_NOT_FOUND nếu planSlug không hợp lệ
     */
    @Transactional
    public AuthResponse handle(RegisterTenantCommand command) {
        log.info("Bắt đầu đăng ký tenant mới — email: {}, plan: {}", command.email(), command.planSlug());

        // 1. Validate email unique toàn hệ thống
        if (tenantRepository.existsByEmail(command.email())) {
            throw new SmartFnbException("EMAIL_ALREADY_EXISTS",
                    "Email '" + command.email() + "' đã được sử dụng bởi tài khoản khác", 409);
        }

        // 2. Tìm gói dịch vụ theo slug
        var plan = planRepository.findBySlug(command.planSlug())
                .orElseThrow(() -> new SmartFnbException("PLAN_NOT_FOUND",
                        "Gói dịch vụ '" + command.planSlug() + "' không tồn tại"));

        // 3. Tạo Tenant
        var tenant = TenantJpaEntity.builder()
                .name(command.tenantName())
                .slug(generateSlug(command.tenantName()))
                .email(command.email())
                .phone(command.phone())
                .planId(plan.getId())
                .status("ACTIVE")
                .build();
        tenant = tenantRepository.save(tenant);
        UUID tenantId = tenant.getId();

        // 4. Tạo User owner với mật khẩu đã hash
        String hashedPassword = passwordEncoder.encode(command.password());
        var user = UserJpaEntity.builder()
                .tenantId(tenantId)
                .fullName(command.ownerName())
                .email(command.email())
                .phone(command.phone())
                .passwordHash(hashedPassword)
                .status("ACTIVE")
                .failedLoginCount(0)
                .build();
        user = userRepository.save(user);
        UUID userId = user.getId();

        // 5. Tạo Role OWNER mặc định cho Tenant
        var ownerRole = RoleJpaEntity.builder()
                .tenantId(tenantId)
                .name("OWNER")
                .description("Quyền quản trị cao nhất (Chủ quán)")
                .isSystem(true)
                .build();
        ownerRole = roleJpaRepository.save(ownerRole);
        UUID roleId = ownerRole.getId();

        // 6. Gán Role OWNER cho User vừa tạo
        var userRole = UserRoleJpaEntity.builder()
                .userId(userId)
                .roleId(roleId)
                .build();
        userRoleJpaRepository.save(userRole);

        // 7. Gán toàn bộ Permissions cho Role OWNER
        List<String> allPermissionCodes = permissionRepository.findAll().stream()
                .map(PermissionJpaEntity::getId)
                .toList();

        List<RolePermissionJpaEntity> rolePermissions = allPermissionCodes.stream()
                .map(code -> RolePermissionJpaEntity.builder()
                        .roleId(roleId)
                        .permissionId(code)
                        .build())
                .toList();
        rolePermissionJpaRepository.saveAll(rolePermissions);

        // 8. Tạo JWT ngay — role OWNER, lấy tất cả quyền (full permissions)
        String accessToken  = jwtService.generateAccessToken(userId, tenantId, "OWNER",
                allPermissionCodes, null);
        String refreshToken = jwtService.generateRefreshToken(userId);

        log.info("Đăng ký tenant thành công — tenantId: {}, userId: {}", tenantId, userId);

        // Publish domain event — SubscriptionModule sẽ consume để tạo subscription
        // (theo DOMAIN_EVENTS.md: TenantRegisteredEvent)
        eventPublisher.publishEvent(
                new com.smartfnb.auth.domain.event.TenantRegisteredEvent(
                        tenantId, userId, command.planSlug(),
                        java.time.Instant.now()));

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getAccessExpirationSeconds(),
                userId.toString(),
                tenantId.toString(),
                "OWNER"
        );
    }

    /**
     * Tạo slug URL-friendly từ tên tenant.
     * Chuyển thành lowercase, thay khoảng trắng và ký tự đặc biệt bằng dấu gạch ngang.
     *
     * @param name tên tenant gốc
     * @return slug dạng "phu-long-cafe"
     */
    private String generateSlug(String name) {
        String base = name.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        // Thêm số ngẫu nhiên 4 chữ số để tránh trùng
        return base + "-" + (int)(Math.random() * 9000 + 1000);
    }
}
