package com.smartfnb.branch.application;

import com.smartfnb.branch.application.dto.BranchRequest;
import com.smartfnb.branch.application.dto.BranchResponse;
import com.smartfnb.branch.application.dto.PaymentConfigRequest;
import com.smartfnb.branch.application.dto.PaymentConfigResponse;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaEntity;
import com.smartfnb.branch.infrastructure.persistence.BranchJpaRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchPaymentConfigJpaEntity;
import com.smartfnb.branch.infrastructure.persistence.BranchPaymentConfigJpaRepository;
import com.smartfnb.branch.infrastructure.persistence.BranchUserJpaEntity;
import com.smartfnb.branch.infrastructure.persistence.BranchUserJpaRepository;
import com.smartfnb.auth.infrastructure.persistence.UserRepository;
import com.smartfnb.auth.infrastructure.persistence.UserJpaEntity;
import com.smartfnb.plan.application.SubscriptionService;
import com.smartfnb.plan.application.dto.SubscriptionResponse;
import com.smartfnb.shared.AesEncryptionUtil;
import com.smartfnb.shared.exception.SmartFnbException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý các nghiệp vụ liên quan đến chi nhánh.
 * Bao gồm logic kiểm tra số lượng chi nhánh theo gói dịch vụ (Plan) đang sử dụng.
 *
 * @author vutq
 * @since 2026-03-27
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BranchService {

    private final BranchJpaRepository branchRepository;
    private final BranchUserJpaRepository branchUserRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    // author: Hoàng | date: 27-04-2026 | note: inject cho payment config PayOS
    private final BranchPaymentConfigJpaRepository paymentConfigRepository;
    private final AesEncryptionUtil aesEncryptionUtil;

    /**
     * Lấy danh sách toàn bộ chi nhánh của Tenant.
     */
    @Transactional(readOnly = true)
    public List<BranchResponse> getAllBranchesByTenant(UUID tenantId) {
        return branchRepository.findByTenantId(tenantId).stream()
                .map(BranchResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách chi nhánh mà nhân viên được gán.
     */
    @Transactional(readOnly = true)
    public List<BranchResponse> getAssignedBranches(UUID tenantId, UUID userId) {
        List<UUID> assignedBranchIds = branchUserRepository.findByUserId(userId)
                .stream()
                .map(com.smartfnb.branch.infrastructure.persistence.BranchUserJpaEntity::getBranchId)
                .toList();

        return branchRepository.findAllById(assignedBranchIds).stream()
                .filter(b -> b.getTenantId().equals(tenantId)) // Double check tenant
                .map(BranchResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Tạo mới một chi nhánh cho Tenant.
     * Validate: tenant không được vượt quá số lượng chi nhánh tối đa (maxBranches) của gói Plan.
     */
    @Transactional
    public BranchResponse createBranch(UUID tenantId, BranchRequest request) {
        log.info("Bắt đầu tạo chi nhánh mới cho tenantId={}", tenantId);

        // 1. Kiểm tra gói subscription hiện tại
        SubscriptionResponse currentSub = subscriptionService.getCurrentSubscription(tenantId);
        
        // 2. Đọc cấu hình maxBranches từ Plan (có thể null nếu là Premium)
        Integer maxBranches = currentSub.plan().maxBranches();

        // Validate nếu có giới hạn
        if (maxBranches != null) {
            // 3. Đếm số chi nhánh hiện tại (chỉ đếm ACTIVE để không tính các chi nhánh đã xoá/tạm dừng)
            long currentBranchCount = branchRepository.countByTenantIdAndStatus(tenantId, "ACTIVE");

            if (currentBranchCount >= maxBranches) {
                throw new SmartFnbException("PLAN_LIMIT_EXCEEDED", 
                        "Số lượng chi nhánh đã đạt giới hạn của gói dịch vụ hiện tại (" + maxBranches + "). Vui lòng nâng cấp gói.", 
                        403);
            }
        }

        // 5. Tạo mới chi nhánh
        BranchJpaEntity newBranch = BranchJpaEntity.builder()
                .tenantId(tenantId)
                .name(request.name())
                .code(request.code())
                .address(request.address())
                .phone(request.phone())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .status("ACTIVE")
                .build();

        newBranch = branchRepository.save(newBranch);
        log.info("Tạo chi nhánh thành công id={}, name={}", newBranch.getId(), newBranch.getName());
        return BranchResponse.fromEntity(newBranch);
    }

    /**
     * Chỉnh sửa thông tin chi nhánh.
     */
    @Transactional
    public BranchResponse updateBranch(UUID tenantId, UUID branchId, BranchRequest request) {
        BranchJpaEntity branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new SmartFnbException("BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh", 404));

        if (!branch.getTenantId().equals(tenantId)) {
            throw new SmartFnbException("ACCESS_DENIED", "Bạn không có quyền sửa chi nhánh này", 403);
        }

        branch.setName(request.name());
        branch.setCode(request.code());
        branch.setAddress(request.address());
        branch.setPhone(request.phone());
        branch.setLatitude(request.latitude());
        branch.setLongitude(request.longitude());

        branch = branchRepository.save(branch);
        return BranchResponse.fromEntity(branch);
    }

    /**
     * Gán nhân viên vào chi nhánh làm việc.
     */
    @Transactional
    public void assignUserToBranch(UUID tenantId, UUID branchId, UUID userId) {
        // 1. Kiểm tra branch thuộc tenant
        BranchJpaEntity branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new SmartFnbException("BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh", 404));
        if (!branch.getTenantId().equals(tenantId)) {
            throw new SmartFnbException("ACCESS_DENIED", "Chi nhánh không thuộc tenant này", 403);
        }

        // 2. Kiểm tra user thuộc tenant
        UserJpaEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new SmartFnbException("USER_NOT_FOUND", "Không tìm thấy nhân viên", 404));
        if (!user.getTenantId().equals(tenantId)) {
            throw new SmartFnbException("ACCESS_DENIED", "Nhân viên không thuộc tenant này", 403);
        }

        // 3. Kiểm tra đã gán chưa
        if (branchUserRepository.existsByBranchIdAndUserId(branchId, userId)) {
            throw new SmartFnbException("USER_ALREADY_IN_BRANCH", "Nhân viên đã được gán vào chi nhánh này từ trước", 400);
        }

        BranchUserJpaEntity link = BranchUserJpaEntity.builder()
                .branchId(branchId)
                .userId(userId)
                .build();
        branchUserRepository.save(link);
        log.info("Đã gán userId={} vào branchId={}", userId, branchId);
    }

    // =========================================================================
    // author: Hoàng
    // date: 27-04-2026
    // note: Hai method quản lý cấu hình PayOS per-branch.
    //       apiKey và checksumKey được mã hoá AES-256 trước khi lưu DB.
    //       Response chỉ trả masked key — không bao giờ trả raw key ra ngoài.
    // =========================================================================

    /**
     * Lấy cấu hình PayOS của chi nhánh.
     * Trả {@link PaymentConfigResponse#notConfigured()} nếu chưa có cấu hình.
     */
    @Transactional(readOnly = true)
    public PaymentConfigResponse getPaymentConfig(UUID tenantId, UUID branchId) {
        validateBranchAccess(tenantId, branchId);

        Optional<BranchPaymentConfigJpaEntity> configOpt =
                paymentConfigRepository.findByBranchIdAndTenantId(branchId, tenantId);

        if (configOpt.isEmpty()) {
            return PaymentConfigResponse.notConfigured();
        }

        BranchPaymentConfigJpaEntity config = configOpt.get();
        // Giải mã để lấy 4 ký tự cuối cho mask — raw key không ra khỏi method này
        String rawApiKey      = aesEncryptionUtil.decrypt(config.getApiKeyEncrypted());
        String rawChecksumKey = aesEncryptionUtil.decrypt(config.getChecksumKeyEncrypted());

        return PaymentConfigResponse.from(config.getClientId(), rawApiKey, rawChecksumKey);
    }

    /**
     * Lưu (hoặc cập nhật) cấu hình PayOS cho chi nhánh.
     * Mã hoá apiKey và checksumKey trước khi lưu DB.
     */
    @Transactional
    public PaymentConfigResponse savePaymentConfig(UUID tenantId, UUID branchId,
                                                   PaymentConfigRequest request) {
        validateBranchAccess(tenantId, branchId);

        String encryptedApiKey      = aesEncryptionUtil.encrypt(request.apiKey());
        String encryptedChecksumKey = aesEncryptionUtil.encrypt(request.checksumKey());

        BranchPaymentConfigJpaEntity config = paymentConfigRepository
                .findByBranchIdAndTenantId(branchId, tenantId)
                .orElse(BranchPaymentConfigJpaEntity.builder()
                        .branchId(branchId)
                        .tenantId(tenantId)
                        .build());

        config.setClientId(request.clientId());
        config.setApiKeyEncrypted(encryptedApiKey);
        config.setChecksumKeyEncrypted(encryptedChecksumKey);
        config.setActive(true);

        paymentConfigRepository.save(config);
        log.info("Đã lưu cấu hình PayOS cho branchId={}", branchId);

        return PaymentConfigResponse.from(request.clientId(), request.apiKey(), request.checksumKey());
    }

    /** Kiểm tra branch thuộc tenant — dùng chung cho các method payment config */
    private void validateBranchAccess(UUID tenantId, UUID branchId) {
        BranchJpaEntity branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new SmartFnbException("BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh", 404));
        if (!branch.getTenantId().equals(tenantId)) {
            throw new SmartFnbException("ACCESS_DENIED", "Chi nhánh không thuộc tenant này", 403);
        }
    }
}
