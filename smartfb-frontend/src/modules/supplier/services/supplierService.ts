import api from '@lib/axios';
import { 
  Supplier, 
  CreateSupplierPayload, 
  UpdateSupplierPayload, 
  SupplierOrder, 
  SupplierDebt 
} from '../types/supplier.types';

const mapSupplier = (s: any): Supplier => ({
  id: s.id,
  name: s.name,
  code: s.code,
  taxCode: s.tax_code,
  address: s.address,
  phone: s.phone,
  email: s.email,
  contactPerson: s.contact_person,
  bankAccount: s.bank_account,
  bankName: s.bank_name,
  isActive: s.is_active,
});

export const supplierService = {
  /**
   * Lấy danh sách nhà cung cấp
   */
  getList: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return (response.data || []).map(mapSupplier);
  },

  /**
   * Lấy chi tiết một nhà cung cấp
   */
  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return mapSupplier(response.data);
  },

  /**
   * Tạo nhà cung cấp mới
   */
  create: async (payload: CreateSupplierPayload): Promise<Supplier> => {
    const response = await api.post('/suppliers', payload);
    return response.data;
  },

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  update: async (id: string, payload: UpdateSupplierPayload): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, payload);
    return response.data;
  },

  /**
   * Xóa nhà cung cấp
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  /**
   * Lấy lịch sử đơn mua hàng từ NCC
   */
  getOrders: async (id: string): Promise<SupplierOrder[]> => {
    const response = await api.get(`/suppliers/${id}/orders`);
    return response.data;
  },

  /**
   * Lấy bảng giá nguyên liệu của NCC
   */
  getPriceList: async (id: string): Promise<SupplierIngredient[]> => {
    const response = await api.get(`/suppliers/${id}/price-list`);
    return response.data;
  },

  /**
   * Lấy thông tin công nợ
   */
  getDebt: async (id: string): Promise<SupplierDebt> => {
    const response = await api.get(`/suppliers/${id}/debt`);
    return response.data;
  },

  /**
   * Tìm kiếm nhà cung cấp
   */
  search: async (query: string): Promise<Supplier[]> => {
    const response = await api.get('/suppliers/search', { params: { q: query } });
    return (response.data || []).map(mapSupplier);
  },
};
