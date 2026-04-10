package com.smartfnb.shared.config;

import com.smartfnb.shared.SecurityUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;
import java.util.UUID;

/**
 * Cấu hình JPA Auditing để tự động set createdBy trong BaseAggregateRoot.
 * AuditorAware lấy userId hiện tại từ SecurityContext.
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    /**
     * Provider trả về userId của người đang thực hiện thao tác.
     * Dùng trong @CreatedBy và @LastModifiedBy của JPA Auditing.
     *
     * @return AuditorAware&lt;UUID&gt; — trả Optional.empty() nếu chưa xác thực
     */
    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> SecurityUtils.getCurrentUserId();
    }
}
