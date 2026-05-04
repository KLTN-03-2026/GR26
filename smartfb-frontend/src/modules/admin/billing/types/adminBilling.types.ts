import type {
  AdminPageResponse,
  AdminTenantPlan,
  AdminTenantSummary,
} from '@modules/admin/tenants/types/adminTenant.types';

export type AdminInvoiceStatus = 'UNPAID' | 'PAID' | 'CANCELLED' | string;

export type AdminInvoiceStatusFilter = 'all' | 'UNPAID' | 'PAID' | 'CANCELLED';

export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  amount: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: AdminInvoiceStatus;
  paymentMethod?: string | null;
  paidAt?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface AdminInvoiceListParams {
  page?: number;
  size?: number;
  status?: string;
}

export interface CreateRenewalInvoicePayload {
  tenantId: string;
  planId: string;
  months: number;
  note?: string;
}

export interface MarkInvoicePaidPayload {
  paymentMethod: string;
}

export interface CancelInvoicePayload {
  reason: string;
}

export type AdminInvoicePageResponse = AdminPageResponse<AdminInvoice>;

export type AdminBillingTenantOption = AdminTenantSummary;

export type AdminBillingPlanOption = AdminTenantPlan;
