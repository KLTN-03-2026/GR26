export interface AdminPageResponse<T> {
  content: T[];
  number?: number;
  page?: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface AdminPlanPageResponse {
  content: AdminPlanSummary[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface AdminTenantSummary {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | string;
  planName: string;
  planExpiresAt?: string | null;
  branchCount: number;
  createdAt: string;
}

export interface AdminPlanSummary {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxBranches?: number | null;
  maxStaff?: number | null;
  maxMenuItems?: number | null;
  isActive: boolean;
}

export interface AdminInvoiceSummary {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  amount: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: 'UNPAID' | 'PAID' | 'CANCELLED' | string;
  paymentMethod?: string | null;
  paidAt?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface AdminDashboardRawData {
  tenantsPage: AdminPageResponse<AdminTenantSummary>;
  tenantDistributionPage: AdminPageResponse<AdminTenantSummary>;
  activeTenantsPage: AdminPageResponse<AdminTenantSummary>;
  suspendedTenantsPage: AdminPageResponse<AdminTenantSummary>;
  plansPage: AdminPlanPageResponse;
  unpaidInvoicesPage: AdminPageResponse<AdminInvoiceSummary>;
}

export interface AdminPlanDistributionItem {
  planName: string;
  tenantCount: number;
}

export interface AdminDashboardOverview {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  recentTenants: AdminTenantSummary[];
  pendingInvoices: AdminInvoiceSummary[];
  planDistribution: AdminPlanDistributionItem[];
  activePlans: number;
  hasAnyData: boolean;
}
