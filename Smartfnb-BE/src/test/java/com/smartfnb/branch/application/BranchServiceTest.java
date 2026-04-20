package com.smartfnb.branch.application;

import com.smartfnb.branch.application.dto.BranchRequest;
import com.smartfnb.branch.application.dto.BranchResponse;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaEntity;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchUserJpaRepository;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.plan.application.SubscriptionService;
import com.smartfnb.plan.application.dto.PlanResponse;
import com.smartfnb.plan.application.dto.SubscriptionResponse;
import com.smartfnb.shared.exception.SmartFnbException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BranchServiceTest {

    @Mock
    private BranchJpaRepository branchRepository;

    @Mock
    private BranchUserJpaRepository branchUserRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private BranchService branchService;

    private UUID tenantId;
    private BranchRequest request;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        request = new BranchRequest("Chi Nhánh Tôn Đức Thắng", "Tôn Đức Thắng, Q1", "0987654321", null);
    }

    @Test
    @DisplayName("Tạo chi nhánh thành công khi số lượng hiện tại nhỏ hơn maxBranches")
    void createBranch_Success_WhenUnderLimit() {
        // Arrange
        PlanResponse planResponse = new PlanResponse(
                UUID.randomUUID(), "Basic", "basic", java.math.BigDecimal.ZERO, 3, new com.smartfnb.plan.domain.valueobject.FeatureFlag(true, false, false, false, false), true);
        SubscriptionResponse subResp = new SubscriptionResponse(
                UUID.randomUUID(), tenantId, planResponse, "ACTIVE", null, null);
        
        when(subscriptionService.getCurrentSubscription(tenantId)).thenReturn(subResp);
        when(branchRepository.countByTenantId(tenantId)).thenReturn(2L); // 2 < 3

        BranchJpaEntity savedEntity = BranchJpaEntity.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .name(request.name())
                .build();
        when(branchRepository.save(any(BranchJpaEntity.class))).thenReturn(savedEntity);

        // Act
        BranchResponse response = branchService.createBranch(tenantId, request);

        // Assert
        assertNotNull(response);
        assertEquals(request.name(), response.name());
        verify(branchRepository).save(any(BranchJpaEntity.class));
    }

    @Test
    @DisplayName("Ném lỗi SmartFnbException khi số lượng chi nhánh vượt giới hạn maxBranches")
    void createBranch_ThrowsException_WhenLimitExceeded() {
        // Arrange
        PlanResponse planResponse = new PlanResponse(
                UUID.randomUUID(), "Basic", "basic", java.math.BigDecimal.ZERO, 1, new com.smartfnb.plan.domain.valueobject.FeatureFlag(true, false, false, false, false), true);
        SubscriptionResponse subResp = new SubscriptionResponse(
                UUID.randomUUID(), tenantId, planResponse, "ACTIVE", null, null);

        when(subscriptionService.getCurrentSubscription(tenantId)).thenReturn(subResp);
        when(branchRepository.countByTenantId(tenantId)).thenReturn(1L); // 1 >= 1 => LIMIT EXCEEDED

        // Act & Assert
        SmartFnbException exception = assertThrows(SmartFnbException.class, () -> 
            branchService.createBranch(tenantId, request)
        );

        assertEquals("PLAN_LIMIT_EXCEEDED", exception.getErrorCode());
        assertTrue(exception.getMessage().contains("Số lượng chi nhánh đã đạt giới hạn"));
        verify(branchRepository, never()).save(any(BranchJpaEntity.class));
    }

    @Test
    @DisplayName("Mặc định giới hạn 1 chi nhánh khi gói cước không có FeatureFlag maxBranches")
    void createBranch_DefaultTo1Branch_WhenFeatureFlagIsMissing() {
        // Arrange
        PlanResponse planResponse = new PlanResponse(
                UUID.randomUUID(), "MissingCfg", "miss", java.math.BigDecimal.ZERO, 1, new com.smartfnb.plan.domain.valueobject.FeatureFlag(false, false, false, false, false), true);
        SubscriptionResponse subResp = new SubscriptionResponse(
                UUID.randomUUID(), tenantId, planResponse, "ACTIVE", null, null);

        when(subscriptionService.getCurrentSubscription(tenantId)).thenReturn(subResp);
        when(branchRepository.countByTenantId(tenantId)).thenReturn(1L); // 1 >= default 1

        // Act & Assert
        SmartFnbException exception = assertThrows(SmartFnbException.class, () -> 
            branchService.createBranch(tenantId, request)
        );

        assertEquals("PLAN_LIMIT_EXCEEDED", exception.getErrorCode());
        verify(branchRepository, never()).save(any(BranchJpaEntity.class));
    }
}
