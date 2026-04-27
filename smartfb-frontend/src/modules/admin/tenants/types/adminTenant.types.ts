export type AdminTenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | string;

export type AdminTenantStatusFilter = 'all' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export interface AdminPageResponse<T> {
  content: T[];
  number?: number;
  page?: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface AdminTenantSummary {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: AdminTenantStatus;
  planName: string;
  planExpiresAt?: string | null;
  branchCount: number;
  createdAt: string;
}

export interface AdminSubscription {
  subscriptionId: string;
  tenantId: string;
  plan: AdminTenantPlan | null;
  status: string;
  startedAt: string;
  expiresAt?: string | null;
}

export interface AdminTenantPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxBranches: number | null;
  maxStaff: number | null;
  maxMenuItems: number | null;
  isActive: boolean;
}

export interface AdminTenantPlanPageResponse {
  content: AdminTenantPlan[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface AdminTenantDetail extends AdminTenantSummary {
  slug: string;
  taxCode?: string | null;
  logoUrl?: string | null;
  planId?: string | null;
  subscriptionHistory: AdminSubscription[];
  totalInvoices: number;
}

export interface AdminTenantListParams {
  page?: number;
  size?: number;
  status?: string;
  planId?: string;
  keyword?: string;
}

export interface ChangeTenantPlanPayload {
  newPlanId: string;
  newExpiresAt: string;
  note?: string;
}

export interface SuspendTenantPayload {
  reason: string;
}
