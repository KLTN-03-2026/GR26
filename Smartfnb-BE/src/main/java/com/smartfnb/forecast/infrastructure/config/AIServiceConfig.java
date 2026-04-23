package com.smartfnb.forecast.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Cấu hình RestTemplate dùng để gọi AI Service.
 * Dùng SimpleClientHttpRequestFactory để set timeout — tương thích Spring Boot 3.x.
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Configuration
public class AIServiceConfig {

    @Value("${ai.service.timeout.connect:5000}")
    private int connectTimeoutMs;

    @Value("${ai.service.timeout.read:10000}")
    private int readTimeoutMs;

    /**
     * RestTemplate với timeout cấu hình sẵn cho AI Service.
     * Dùng qualifier "aiRestTemplate" để tránh conflict với RestTemplate khác nếu có.
     *
     * @return RestTemplate đã cấu hình timeout
     */
    @Bean("aiRestTemplate")
    public RestTemplate aiRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return new RestTemplate(factory);
    }
}
