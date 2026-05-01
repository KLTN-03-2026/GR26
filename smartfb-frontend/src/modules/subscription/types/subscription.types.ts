export interface SubscriptionPlanFeatureFlags {
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

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxBranches: number | null;
  maxStaff: number | null;
  maxMenuItems: number | null;
  features: SubscriptionPlanFeatureFlags | null;
  isActive: boolean;
}

export interface CurrentSubscription {
  subscriptionId: string;
  tenantId: string;
  plan: SubscriptionPlan | null;
  status: string;
  startedAt: string;
  expiresAt?: string | null;
}
