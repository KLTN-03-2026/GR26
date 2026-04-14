export interface Supplier {
  id: string;
  name: string;
  code: string;
  taxCode: string; // Map from tax_code
  address: string;
  phone: string;
  email: string;
  contactPerson: string; // Map from contact_person
  bankAccount: string; // Map from bank_account
  bankName: string; // Map from bank_name
  isActive: boolean; // Map from is_active
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
