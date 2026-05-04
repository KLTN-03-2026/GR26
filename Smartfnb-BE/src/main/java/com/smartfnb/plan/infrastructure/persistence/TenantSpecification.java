package com.smartfnb.plan.infrastructure.persistence;

import com.smartfnb.auth.infrastructure.persistence.TenantJpaEntity;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.UUID;

/**
 * Các Specification động để filter Tenant trong Admin module.
 * Sử dụng kết hợp với {@link AdminTenantJpaRepository} qua JpaSpecificationExecutor.
 *
 * <p>Ví dụ dùng:</p>
 * <pre>{@code
 * Specification<TenantJpaEntity> spec = Specification
 *     .where(TenantSpecification.hasStatus("ACTIVE"))
 *     .and(TenantSpecification.hasPlanId(planId))
 *     .and(TenantSpecification.nameOrEmailContains("phuc"));
 * }</pre>
 *
 * @author vutq
 * @since 2026-04-24
 */
public final class TenantSpecification {

    /** Không cho phép khởi tạo lớp utility này */
    private TenantSpecification() {}

    /**
     * Filter theo trạng thái tenant: ACTIVE | SUSPENDED | CANCELLED.
     * Trả về null (bỏ qua filter) nếu status rỗng.
     */
    public static Specification<TenantJpaEntity> hasStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        return (root, query, builder) ->
                builder.equal(root.get("status"), status.toUpperCase());
    }

    /**
     * Filter theo gói dịch vụ đang sử dụng.
     * Trả về null (bỏ qua filter) nếu planId là null.
     */
    public static Specification<TenantJpaEntity> hasPlanId(UUID planId) {
        if (planId == null) {
            return null;
        }
        return (root, query, builder) ->
                builder.equal(root.get("planId"), planId);
    }

    /**
     * Tìm kiếm tenant theo từ khóa trong tên hoặc email (case-insensitive).
     * Trả về null (bỏ qua filter) nếu keyword rỗng.
     */
    public static Specification<TenantJpaEntity> nameOrEmailContains(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        String pattern = "%" + keyword.toLowerCase().trim() + "%";
        return (root, query, builder) ->
                builder.or(
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("email")), pattern)
                );
    }
}
