package com.smartfnb.auth.application.command;

import com.smartfnb.auth.application.dto.AuthResponse;
import com.smartfnb.auth.infrastructure.jwt.JwtService;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchUserJpaRepository;
import com.smartfnb.rbac.domain.service.PermissionService;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Xử lý lệnh chọn chi nhánh làm việc (Select Branch).
 * Cấp lại JWT chứa branchId để sử dụng cho các API cần context chi nhánh.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SelectBranchCommandHandler {

    private final UserRepository userRepository;
    private final BranchJpaRepository branchRepository;
    private final BranchUserJpaRepository branchUserRepository;
    private final PermissionService permissionService;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public AuthResponse handle(UUID currentUserId, UUID currentTenantId, SelectBranchCommand command) {
        log.info("User {} đang yêu cầu đổi sang chi nhánh {}", currentUserId, command.branchId());

        UserJpaEntity user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new SmartFnbException("USER_NOT_FOUND", "Không tìm thấy người dùng", 404));

        if (!branchRepository.existsById(command.branchId())) {
            throw new SmartFnbException("BRANCH_NOT_FOUND", "Chi nhánh không tồn tại", 404);
        }

        // Kiểm tra xem User có quyền truy cập chi nhánh này không (cần thuộc bảng BranchUser)
        boolean hasAccess = branchUserRepository.existsByBranchIdAndUserId(command.branchId(), currentUserId);
        
        // Nếu không có, check xem có phải OWNER không (chủ cửa hàng vào chi nhánh nào cũng được)
        if (!hasAccess) {
            List<String> roles = permissionService.getRoleNames(currentUserId, currentTenantId);
            if (roles.contains("OWNER") || roles.contains("SYSTEM_ADMIN")) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            throw new SmartFnbException("ACCESS_DENIED", "Bạn không có quyền làm việc tại chi nhánh này", 403);
        }

        // Tái cấp JWT chứa branchId
        List<String> roleNames  = permissionService.getRoleNames(user.getId(), currentTenantId);
        String primaryRole = roleNames.isEmpty() ? "STAFF" : roleNames.get(0);
        List<String> permissions = permissionService.getPermissionCodes(user.getId(), currentTenantId);

        String accessToken = jwtService.generateAccessToken(
                user.getId(), currentTenantId, primaryRole, permissions, command.branchId());
        
        // Refresh token chỉ cần userId
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        log.info("Cấp lại JWT thành công cho branchId={}", command.branchId());

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getAccessExpirationSeconds(),
                user.getId().toString(),
                currentTenantId.toString(),
                primaryRole,
                command.branchId().toString()
        );
    }
}
