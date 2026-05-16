export type AdminPlanStatusFilter = 'all' | 'active' | 'inactive';

export type AdminPlanFeatureKey =
  | 'POS'
  | 'INVENTORY'
  | 'PROMOTION'
  | 'AI'
  | 'ADVANCED_REPORT';

export interface AdminPlanFeatureFlags {
  POS: boolean;
  INVENTORY: boolean;
  PROMOTION: boolean;
  AI: boolean;
  ADVANCED_REPORT: boolean;
}

export interface AdminPlanApiFeatureFlags {
  POS?: boolean;
  INVENTORY?: boolean;
  PROMOTION?: boolean;
  REPORT?: boolean;
  AI?: boolean;
  ADVANCED_REPORT?: boolean;
  hasPos?: boolean;
  hasInventory?: boolean;
  hasPromotion?: boolean;
  hasAi?: boolean;
  hasAdvancedReport?: boolean;
  [key: string]: boolean | undefined;
}

export interface AdminPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxBranches: number | null;
  maxStaff: number | null;
  maxMenuItems: number | null;
  features: AdminPlanApiFeatureFlags | null;
  isActive: boolean;
}

export interface AdminPlanPageResponse {
  content: AdminPlan[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface AdminPlanListParams {
  page?: number;
  size?: number;
  activeOnly?: boolean;
}

export interface AdminPlanFormValues {
  name: string;
  slug: string;
  priceMonthly: number;
  maxBranches: number;
  maxStaff: number;
  maxMenuItems: number;
  features: AdminPlanFeatureFlags;
  isActive: boolean;
}

export type CreateAdminPlanPayload = AdminPlanFormValues;

export type UpdateAdminPlanPayload = Omit<AdminPlanFormValues, 'slug'>;
