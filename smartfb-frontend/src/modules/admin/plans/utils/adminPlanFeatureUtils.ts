import type {
  AdminPlan,
  AdminPlanFeatureFlags,
  AdminPlanFeatureKey,
} from '../types/adminPlan.types';

// Thứ tự hiển thị feature trong form, bảng và drawer chi tiết gói dịch vụ
export const ADMIN_PLAN_FEATURE_KEYS: AdminPlanFeatureKey[] = [
  'POS',
  'INVENTORY',
  'PROMOTION',
  'AI',
  'ADVANCED_REPORT',
];

/**
 * Chuẩn hóa feature flags từ nhiều format BE từng trả về về đúng key request hiện tại.
 */
export const normalizeAdminPlanFeatures = (
  features?: AdminPlan['features']
): AdminPlanFeatureFlags => {
  const source = features ?? {};

  return {
    POS: source.POS ?? source.hasPos ?? false,
    INVENTORY: source.INVENTORY ?? source.hasInventory ?? false,
    PROMOTION: source.PROMOTION ?? source.hasPromotion ?? false,
    AI: source.AI ?? source.hasAi ?? false,
    ADVANCED_REPORT:
      source.ADVANCED_REPORT ?? source.REPORT ?? source.hasAdvancedReport ?? false,
  };
};

/**
 * Đếm số feature đang bật sau khi đã chuẩn hóa contract với BE.
 */
export const getEnabledAdminPlanFeatureCount = (plan: AdminPlan): number => {
  const normalizedFeatures = normalizeAdminPlanFeatures(plan.features);

  return ADMIN_PLAN_FEATURE_KEYS.filter((key) => normalizedFeatures[key]).length;
};
