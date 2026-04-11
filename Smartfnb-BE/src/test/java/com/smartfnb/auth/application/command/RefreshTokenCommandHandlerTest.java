package com.smartfnb.auth.application.command;

import com.smartfnb.auth.application.dto.AuthResponse;
import com.smartfnb.auth.infrastructure.jwt.JwtService;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaEntity;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository;
import com.smartfnb.rbac.domain.service.PermissionService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenCommandHandlerTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PermissionService permissionService;

    @Mock
    private BranchJpaRepository branchRepository;

    @InjectMocks
    private RefreshTokenCommandHandler handler;

    private UUID userId;
    private UUID tenantId;
    private UUID branchId;
    private UserJpaEntity userEntity;
    private BranchJpaEntity branchEntity;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        branchId = UUID.randomUUID();

        userEntity = new UserJpaEntity();
        userEntity.setId(userId);
        userEntity.setTenantId(tenantId);
        userEntity.setEmail("test@owner.com");
        userEntity.setPasswordHash("hash");
        userEntity.setStatus("ACTIVE");
        userEntity.setFullName("Nguyễn Văn Cashier");

        branchEntity = new BranchJpaEntity();
        branchEntity.setId(branchId);
        branchEntity.setName("Chi nhánh Mock");
    }

    @Test
    void shouldRefreshAndPreserveBranchIdAndRoles() {
        // Arrange
        String oldRefreshToken = "old-refresh-token";
        String requestedBranchId = branchId.toString();
        RefreshTokenCommand command = new RefreshTokenCommand(oldRefreshToken, requestedBranchId);

        Claims mockClaims = mock(Claims.class);
        when(jwtService.validateAndExtractClaims(oldRefreshToken)).thenReturn(mockClaims);
        when(mockClaims.get("type", String.class)).thenReturn("refresh");
        when(mockClaims.getSubject()).thenReturn(userId.toString());

        when(userRepository.findById(userId)).thenReturn(Optional.of(userEntity));
        when(permissionService.getRoleNames(userId, tenantId)).thenReturn(List.of("CASHIER"));
        when(permissionService.getPermissionCodes(userId, tenantId)).thenReturn(List.of("ORDER_CREATE", "TABLE_VIEW"));
        when(branchRepository.findById(branchId)).thenReturn(Optional.of(branchEntity));

        String newAccessToken = "new-access-token";
        when(jwtService.generateAccessToken(
                eq(userId), eq(tenantId), eq("CASHIER"), eq(List.of("ORDER_CREATE", "TABLE_VIEW")), eq(branchId)
        )).thenReturn(newAccessToken);
        when(jwtService.getAccessExpirationSeconds()).thenReturn(3600L);

        // Act
        AuthResponse response = handler.handle(command);

        // Assert
        assertNotNull(response);
        assertEquals(newAccessToken, response.accessToken());
        assertEquals(oldRefreshToken, response.refreshToken()); // keeps the old refresh token
        assertEquals("CASHIER", response.role());
        assertEquals("Nguyễn Văn Cashier", response.fullName());
        assertEquals(requestedBranchId, response.branchId());
        assertEquals("Chi nhánh Mock", response.branchName());

        verify(jwtService).generateAccessToken(
                eq(userId), eq(tenantId), eq("CASHIER"), eq(List.of("ORDER_CREATE", "TABLE_VIEW")), eq(branchId)
        );
    }
}
