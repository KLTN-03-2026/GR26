package com.smartfnb.plan.domain;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

/**
 * Value Object đại diện cho feature flags của một Plan.
 * Parse từ cột JSONB "features" trong bảng plans.
 *
 * <p>Cấu trúc JSON:
 * <pre>{@code
 * {
 *   "POS": true,
 *   "INVENTORY": true,
 *   "PROMOTION": false,
 *   "AI_SUGGEST": false,
 *   "MULTI_BRANCH": true,
 *   "REPORT_ADVANCED": false
 * }
 * }</pre>
 * </p>
 *
 * @author SmartF&B Team
 * @since 2026-03-27
 */
@Slf4j
public record FeatureFlag(Map<String, Boolean> flags) {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Feature keys chuẩn của hệ thống */
    public static final String POS              = "POS";
    public static final String INVENTORY        = "INVENTORY";
    public static final String PROMOTION        = "PROMOTION";
    public static final String AI_SUGGEST       = "AI_SUGGEST";
    public static final String MULTI_BRANCH     = "MULTI_BRANCH";
    public static final String REPORT_ADVANCED  = "REPORT_ADVANCED";
    public static final String STAFF_MANAGEMENT = "STAFF_MANAGEMENT";

    /**
     * Parse chuỗi JSON features từ DB thành FeatureFlag.
     * Trả về FeatureFlag rỗng nếu JSON không hợp lệ.
     *
     * @param jsonFeatures chuỗi JSON từ cột features của Plan
     * @return FeatureFlag object
     */
    public static FeatureFlag fromJson(String jsonFeatures) {
        if (jsonFeatures == null || jsonFeatures.isBlank() || "{}".equals(jsonFeatures.trim())) {
            return new FeatureFlag(new HashMap<>());
        }
        try {
            Map<String, Boolean> map = MAPPER.readValue(
                    jsonFeatures, new TypeReference<Map<String, Boolean>>() {});
            return new FeatureFlag(map);
        } catch (Exception e) {
            log.warn("Không thể parse features JSON: {} — {}", jsonFeatures, e.getMessage());
            return new FeatureFlag(new HashMap<>());
        }
    }

    /**
     * Kiểm tra tính năng có được kích hoạt trong gói dịch vụ không.
     *
     * @param featureKey tên feature (VD: INVENTORY, AI_SUGGEST)
     * @return true nếu feature được bật
     */
    public boolean isEnabled(String featureKey) {
        return Boolean.TRUE.equals(flags.getOrDefault(featureKey, false));
    }

    /**
     * Kiểm tra gói có hỗ trợ đa chi nhánh không.
     *
     * @return true nếu MULTI_BRANCH = true
     */
    public boolean supportsMultiBranch() {
        return isEnabled(MULTI_BRANCH);
    }

    /**
     * Kiểm tra gói có hỗ trợ tính năng AI không.
     *
     * @return true nếu AI_SUGGEST = true
     */
    public boolean supportsAi() {
        return isEnabled(AI_SUGGEST);
    }

    /**
     * Chuyển features thành chuỗi JSON để lưu DB.
     *
     * @return chuỗi JSON
     */
    public String toJson() {
        try {
            return MAPPER.writeValueAsString(flags);
        } catch (Exception e) {
            return "{}";
        }
    }
}
