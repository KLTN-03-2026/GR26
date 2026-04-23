package com.smartfnb.forecast.infrastructure.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

/**
 * HTTP Client để gọi AI Service — CHỈ dùng cho trigger train/predict và config.
 * KHÔNG dùng để lấy forecast (đọc DB trực tiếp thay thế để đảm bảo response < 200ms).
 *
 * @author Hoàng
 * @since 2026-04-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIServiceClient {

    private final @Qualifier("aiRestTemplate") RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    /**
     * Trigger train model thủ công cho 1 tenant.
     * Gọi fire-and-forget — không chờ train hoàn thành.
     * Log warn nếu AI Service không phản hồi nhưng không throw exception.
     *
     * @param tenantId UUID tenant cần train
     * @param jwtToken JWT token của user đang đăng nhập
     */
    public void triggerTrain(String tenantId, String jwtToken) {
        try {
            HttpHeaders headers = buildHeaders(jwtToken);
            Map<String, String> body = Map.of("tenant_id", tenantId);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            restTemplate.postForEntity(
                    aiServiceUrl + "/api/v1/train/trigger",
                    request,
                    Void.class
            );
            log.info("Đã gửi trigger train cho tenant={}", tenantId);
        } catch (Exception e) {
            // Không throw — train failure không nên block API response
            log.warn("Không thể trigger train cho tenant={}: {}", tenantId, e.getMessage());
        }
    }

    /**
     * Trigger predict thủ công cho tất cả chi nhánh.
     * Gọi fire-and-forget.
     *
     * @param jwtToken JWT token của user đang đăng nhập
     */
    public void triggerPredict(String jwtToken) {
        try {
            HttpHeaders headers = buildHeaders(jwtToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            restTemplate.postForEntity(
                    aiServiceUrl + "/api/v1/train/predict",
                    request,
                    Void.class
            );
            log.info("Đã gửi trigger predict toàn bộ chi nhánh");
        } catch (Exception e) {
            log.warn("Không thể trigger predict: {}", e.getMessage());
        }
    }

    /**
     * Lấy cấu hình train của 1 chi nhánh.
     *
     * @param branchId UUID chi nhánh
     * @param jwtToken JWT token
     * @return Map cấu hình, rỗng nếu lỗi
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getTrainConfig(String branchId, String jwtToken) {
        try {
            HttpHeaders headers = buildHeaders(jwtToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    aiServiceUrl + "/api/v1/train/config?branch_id=" + branchId,
                    HttpMethod.GET,
                    request,
                    Map.class
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Không thể lấy train config cho branch={}: {}", branchId, e.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Cập nhật cấu hình train của 1 chi nhánh.
     *
     * @param branchId UUID chi nhánh
     * @param config   Map cấu hình mới
     * @param jwtToken JWT token
     */
    public void updateTrainConfig(String branchId, Map<String, Object> config, String jwtToken) {
        try {
            HttpHeaders headers = buildHeaders(jwtToken);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(config, headers);

            restTemplate.exchange(
                    aiServiceUrl + "/api/v1/train/config?branch_id=" + branchId,
                    HttpMethod.PUT,
                    request,
                    Void.class
            );
            log.info("Đã cập nhật train config cho branch={}", branchId);
        } catch (Exception e) {
            log.warn("Không thể cập nhật train config cho branch={}: {}", branchId, e.getMessage());
        }
    }

    /**
     * Tạo HttpHeaders với Authorization Bearer token và Content-Type JSON.
     */
    private HttpHeaders buildHeaders(String jwtToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (jwtToken != null && !jwtToken.isBlank()) {
            headers.setBearerAuth(jwtToken.startsWith("Bearer ") ? jwtToken.substring(7) : jwtToken);
        }
        return headers;
    }
}
