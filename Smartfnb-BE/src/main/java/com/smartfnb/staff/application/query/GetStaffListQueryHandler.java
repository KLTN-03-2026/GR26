package com.smartfnb.staff.application.query;

import com.smartfnb.staff.infrastructure.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Handler truy vấn danh sách nhân viên (S-15).
 * READ ONLY — không @Transactional.
 *
 * @author SmartF&B Team
 * @since 2026-04-06
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GetStaffListQueryHandler {

    private final StaffJpaRepository        staffJpaRepository;
    private final PositionJpaRepository     positionJpaRepository;
    private final StaffUserRoleJpaRepository     userRoleJpaRepository;
    private final StaffRoleJpaRepository         roleJpaRepository;

    /**
     * Lấy danh sách nhân viên có phân trang và filter.
     * Tự động filter theo tenantId từ query.
     *
     * @param query tham số truy vấn
     * @return Page kết quả danh sách nhân viên
     */
    public Page<StaffSummaryResult> handle(GetStaffListQuery query) {
        log.debug("Lấy danh sách nhân viên: tenant={}, status={}", query.tenantId(), query.status());

        // Build Specification với dynamic filter
        Specification<StaffJpaEntity> spec = buildSpec(query);

        int size = Math.min(query.size(), 100);
        var pageable = PageRequest.of(query.page(), size);
        Page<StaffJpaEntity> page = staffJpaRepository.findAll(spec, pageable);

        // Load positions để map positionName
        Map<UUID, String> positionNames = positionJpaRepository
                .findByTenantId(query.tenantId())
                .stream()
                .collect(Collectors.toMap(p -> p.getId(), p -> p.getName()));

        // Load roles cho từng staff
        List<StaffSummaryResult> results = page.getContent().stream()
                .map(staff -> toResult(staff, positionNames))
                .toList();

        return new PageImpl<>(results, pageable, page.getTotalElements());
    }

    /**
     * Build dynamic Specification từ query params.
     */
    private Specification<StaffJpaEntity> buildSpec(GetStaffListQuery query) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // BẮT BUỘC: filter theo tenantId
            predicates.add(cb.equal(root.get("tenantId"), query.tenantId()));

            // Filter theo positionId
            if (query.positionId() != null) {
                predicates.add(cb.equal(root.get("positionId"), query.positionId()));
            }

            // Filter theo status
            if (query.status() != null && !query.status().isBlank()) {
                predicates.add(cb.equal(root.get("status"), query.status().toUpperCase()));
            }

            // Tìm kiếm theo tên hoặc SĐT
            if (query.keyword() != null && !query.keyword().isBlank()) {
                String pattern = "%" + query.keyword().trim().toLowerCase() + "%";
                Predicate byName  = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate byPhone = cb.like(root.get("phone"), "%" + query.keyword().trim() + "%");
                predicates.add(cb.or(byName, byPhone));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Chuyển entity thành result DTO.
     */
    private StaffSummaryResult toResult(StaffJpaEntity staff, Map<UUID, String> positionNames) {
        // Lấy tên roles (không load lazy để tránh N+1)
        List<UUID> roleIds = userRoleJpaRepository.findRoleIdsByUserId(staff.getId());
        List<String> roleNames = roleIds.isEmpty() ? List.of() :
                roleJpaRepository.findAllById(roleIds)
                        .stream().map(r -> r.getName()).toList();

        return new StaffSummaryResult(
                staff.getId(),
                staff.getFullName(),
                staff.getPhone(),
                staff.getEmail(),
                staff.getEmployeeCode(),
                staff.getStatus(),
                staff.getPositionId(),
                staff.getPositionId() != null ? positionNames.get(staff.getPositionId()) : null,
                staff.getHireDate(),
                staff.getCreatedAt(),
                roleNames
        );
    }
}
