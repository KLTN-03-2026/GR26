package com.smartfnb.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình SpringDoc OpenAPI / Swagger UI.
 * Định nghĩa thông tin API và security scheme cho Bearer JWT.
 *
 * <p>Truy cập: http://localhost:8080/swagger-ui.html</p>
 *
 * @author SmartF&B Team
 * @since 2026-03-26
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    /**
     * Cấu hình OpenAPI với thông tin dự án và JWT Bearer security scheme.
     *
     * @return OpenAPI object được cấu hình
     */
    @Bean
    public OpenAPI smartFnbOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("SmartF&B API")
                        .version("1.0.0")
                        .description("SaaS POS & Quản lý Chuỗi F&B — Tài liệu API đầy đủ")
                        .contact(new Contact()
                                .name("SmartF&B Team")
                                .email("dev@smartfnb.vn"))
                        .license(new License().name("Private")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập JWT access token (không cần prefix 'Bearer ')")));
    }
}
