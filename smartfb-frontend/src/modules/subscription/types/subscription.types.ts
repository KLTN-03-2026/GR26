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

export type TenantInvoiceStatus = 'UNPAID' | 'PAID' | 'CANCELLED' | string;

export interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName?: string | null;
  planId: string;
  planName: string;
  amount: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: TenantInvoiceStatus;
  paymentMethod?: string | null;
  paidAt?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface TenantInvoicePageResponse {
  content: TenantInvoice[];
  number?: number;
  page?: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface TenantInvoiceListParams {
  page?: number;
  size?: number;
}

export interface TenantRenewPayload {
  planId: string;
  months: number;
  note?: string;
}

export type PlanPaymentMethod = 'VIETQR' | 'MOMO';

export interface GeneratePlanPaymentQRPayload {
  invoiceId: string;
  method: PlanPaymentMethod;
}

export interface PlanQRPayment {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  qrCodeUrl: string;
  qrCodeData: string;
  paymentMethod: string;
  expiresInSeconds: number;
}
