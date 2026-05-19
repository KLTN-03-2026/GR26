import type {
  PlanLimitResource,
  PlanLimitViolation,
  SubscriptionPlan,
  TenantPackageUsage,
} from '@modules/subscription/types/subscription.types';

interface PlanLimitDefinition {
  resource: PlanLimitResource;
  label: string;
  getCurrent: (usage: TenantPackageUsage) => number;
  getLimit: (plan: SubscriptionPlan) => number | null;
}

/**
 * Danh sách quota nghiệp vụ của gói dịch vụ cần so sánh với dữ liệu hiện tại của tenant.
 */
export const PLAN_LIMIT_DEFINITIONS: PlanLimitDefinition[] = [
  {
    resource: 'branches',
    label: 'Chi nhánh',
    getCurrent: (usage) => usage.branches,
    getLimit: (plan) => plan.maxBranches,
  },
  {
    resource: 'staff',
    label: 'Nhân viên',
    getCurrent: (usage) => usage.staff,
    getLimit: (plan) => plan.maxStaff,
  },
  {
    resource: 'menuItems',
    label: 'Món',
    getCurrent: (usage) => usage.menuItems,
    getLimit: (plan) => plan.maxMenuItems,
  },
];

/**
 * Kiểm tra các giới hạn của gói so với usage hiện tại của tenant.
 *
 * @param plan - Gói owner đang chọn
 * @param usage - Số lượng dữ liệu hiện tại của tenant
 */
export const getPlanLimitViolations = (
  plan: SubscriptionPlan,
  usage: TenantPackageUsage | undefined
): PlanLimitViolation[] => {
  if (!usage) {
    return [];
  }

  return PLAN_LIMIT_DEFINITIONS.flatMap((definition) => {
    const limit = definition.getLimit(plan);

    if (limit === null) {
      return [];
    }

    const current = definition.getCurrent(usage);

    if (current <= limit) {
      return [];
    }

    return [
      {
        resource: definition.resource,
        current,
        limit,
        label: definition.label,
      },
    ];
  });
};

export const hasPlanLimitViolation = (
  plan: SubscriptionPlan,
  usage: TenantPackageUsage | undefined
): boolean => getPlanLimitViolations(plan, usage).length > 0;

export const getPlanLimitViolationMessage = (violations: PlanLimitViolation[]): string => {
  if (violations.length === 0) {
    return '';
  }

  return violations
    .map((violation) => `${violation.label}: ${violation.current}/${violation.limit}`)
    .join(', ');
};
