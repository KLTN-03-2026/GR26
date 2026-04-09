package com.smartfnb.plan.domain.valueobject;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

/**
 * Value Object mô tả các tính năng (features) được bật/tắt trong một Gói dịch vụ (Plan).
 * Ánh xạ lấy từ cột `features` (JSONB) của bảng `plans`.
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
public record FeatureFlag(
        boolean hasPos,
        boolean hasInventory,
        boolean hasPromotion,
        boolean hasAi,
        boolean hasAdvancedReport
) {
    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Tạo từ Map (thường dùng khi nhận Request DTO).
     */
    public static FeatureFlag fromMap(Map<String, Boolean> map) {
        if (map == null) return new FeatureFlag(false, false, false, false, false);
        return new FeatureFlag(
                map.getOrDefault("POS", false),
                map.getOrDefault("INVENTORY", false),
                map.getOrDefault("PROMOTION", false),
                map.getOrDefault("AI", false),
                map.getOrDefault("ADVANCED_REPORT", false)
        );
    }

    /**
     * Parse từ chuỗi JSON lấy dưới DB lên.
     * VD: {"POS": true, "INVENTORY": false}
     *
     * @param json chuỗi JSON cấu hình tính năng
     * @return object FeatureFlag
     */
    public static FeatureFlag fromJson(String json) {
        if (json == null || json.isBlank()) {
            return new FeatureFlag(false, false, false, false, false);
        }
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Boolean> parsed = mapper.readValue(json, Map.class);
            return fromMap(parsed);
        } catch (JsonProcessingException e) {
            System.err.println("Lỗi parse string JSON features: " + json + " - " + e.getMessage());
            return new FeatureFlag(false, false, false, false, false);
        }
    }

    /**
     * Chuyển object thành chuỗi JSON để lưu xuống DB.
     */
    public String toJson() {
        try {
            Map<String, Boolean> map = Map.of(
                    "POS", hasPos,
                    "INVENTORY", hasInventory,
                    "PROMOTION", hasPromotion,
                    "AI", hasAi,
                    "ADVANCED_REPORT", hasAdvancedReport
            );
            return mapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            System.err.println("Lỗi parse object features sang JSON: " + e.getMessage());
            return "{}";
        }
    }
}
