package com.smartfnb.auth.application.command;

import com.smartfnb.auth.application.dto.AuthResponse;
import com.smartfnb.auth.infrastructure.jwt.JwtService;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchUserJpaRepository;
import com.smartfnb.rbac.domain.service.PermissionService;
import com.smartfnb.shared.exception.SmartFnbException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SelectBranchCommandHandlerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BranchJpaRepository branchRepository;

    @Mock
    private BranchUserJpaRepository branchUserRepository;

    @Mock
    private PermissionService permissionService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private SelectBranchCommandHandler handler;

    private UUID tenantId;
    private UUID userId;
    private UUID branchId;
    private SelectBranchCommand command;
    private UserJpaEntity user;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        branchId = UUID.randomUUID();
        command = new SelectBranchCommand(branchId);

        user = new UserJpaEntity();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setEmail("nvA@smartfnb.com");
        user.setFullName("Nhân Viên A");
    }

    @Test
    @DisplayName("Đổi chi nhánh thành công khi người dùng được phân công vào chi nhánh này")
    void handle_Success_WhenUserAssignedToBranch() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(branchRepository.existsById(branchId)).thenReturn(true);
        when(branchUserRepository.existsByBranchIdAndUserId(branchId, userId)).thenReturn(true);
        
        when(permissionService.getRoleNames(userId, tenantId)).thenReturn(List.of("STAFF"));
        when(permissionService.getPermissionCodes(userId, tenantId)).thenReturn(List.of("CREATE_ORDER"));
        
        when(jwtService.generateAccessToken(userId, tenantId, "STAFF", List.of("CREATE_ORDER"), branchId))
                .thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(userId))
                .thenReturn("new-refresh-token");

        AuthResponse response = handler.handle(userId, tenantId, command);

        assertNotNull(response);
        assertEquals("new-access-token", response.accessToken());
        assertEquals("new-refresh-token", response.refreshToken());
        assertEquals(branchId, response.branchId());
    }

    @Test
    @DisplayName("Ném exception khi người dùng Không có quyền làm việc tại chi nhánh này")
    void handle_ThrowsException_WhenAccessDenied() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(branchRepository.existsById(branchId)).thenReturn(true);
        
        // Không được gán vào branch
        when(branchUserRepository.existsByBranchIdAndUserId(branchId, userId)).thenReturn(false);
        // Không phải OWNER
        when(permissionService.getRoleNames(userId, tenantId)).thenReturn(List.of("STAFF"));

        SmartFnbException ex = assertThrows(SmartFnbException.class, () -> 
                handler.handle(userId, tenantId, command));
                
        assertEquals("ACCESS_DENIED", ex.getErrorCode());
    }
    
    @Test
    @DisplayName("Cho phép người dùng OWNER đổi sang bất kỳ chi nhánh nào mà không cần gán trực tiếp")
    void handle_Success_WhenUserIsOwner() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(branchRepository.existsById(branchId)).thenReturn(true);
        
        // Không được gán trực tiếp
        when(branchUserRepository.existsByBranchIdAndUserId(branchId, userId)).thenReturn(false);
        // Nhưng Role là OWNER
        when(permissionService.getRoleNames(userId, tenantId)).thenReturn(List.of("OWNER"));
        when(permissionService.getPermissionCodes(userId, tenantId)).thenReturn(List.of("ALL_PERMISSIONS"));
        
        when(jwtService.generateAccessToken(eq(userId), eq(tenantId), eq("OWNER"), any(), eq(branchId)))
                .thenReturn("owner-access-token");
        
        AuthResponse response = handler.handle(userId, tenantId, command);
        
        assertNotNull(response);
        assertEquals("owner-access-token", response.accessToken());
        assertEquals(branchId, response.branchId());
    }
}
