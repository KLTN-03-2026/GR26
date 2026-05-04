export interface Supplier {
  id: string;
  name: string;
  code: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  bankAccount: string;
  bankName: string;
  isActive: boolean;
}

export interface BackendSupplier {
  id: string;
  name: string;
  code?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  active: boolean;
}

export interface SupplierPageResponse {
  content: BackendSupplier[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SupplierListParams {
  name?: string;
  page?: number;
  size?: number;
}

export interface SupplierIngredient {
  id: string;
  ingredientId: string;
  ingredientName: string;
  price: number;
  minimumOrderQty: number;
  isPreferred: boolean;
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  entryDate: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export type BackendPurchaseOrderStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';

export interface BackendPurchaseOrderSummary {
  id: string;
  orderNumber: string;
  status: BackendPurchaseOrderStatus;
  supplierId: string;
  branchId: string;
  totalAmount: number | string;
  createdAt: string;
}

export interface PurchaseOrderPageResponse {
  content: BackendPurchaseOrderSummary[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PurchaseOrderListParams {
  branchId?: string;
  status?: BackendPurchaseOrderStatus;
  page?: number;
  size?: number;
}

export interface PurchaseOrderItemPayload {
  itemId: string;
  itemName: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  note?: string;
  expectedDate?: string;
  items: PurchaseOrderItemPayload[];
}

export type UpdatePurchaseOrderPayload = CreatePurchaseOrderPayload;

export interface CancelPurchaseOrderPayload {
  reason?: string;
}

export interface BackendPurchaseOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  unit?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
}

export interface BackendPurchaseOrderDetail extends BackendPurchaseOrderSummary {
  note?: string | null;
  expectedDate?: string | null;
  receivedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: BackendPurchaseOrderItem[];
}

export interface SupplierDebt {
  supplierId: string;
  totalDebt: number;
  paidAmount: number;
  remainingAmount: number;
  lastPaymentDate?: string;
}

export interface CreateSupplierPayload {
  name: string;
  tax_code: string;
  address: string;
  phone: string;
  email?: string;
  contact_person?: string;
  bank_account?: string;
  bank_name?: string;
}

export interface UpdateSupplierPayload extends Partial<CreateSupplierPayload> {
  is_active?: boolean;
}

export interface BackendCreateSupplierPayload {
  name: string;
  code?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  note?: string;
}

export interface BackendUpdateSupplierPayload extends BackendCreateSupplierPayload {
  active: boolean;
}
