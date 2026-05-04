import api from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  BackendCreateSupplierPayload,
  BackendPurchaseOrderDetail,
  BackendPurchaseOrderStatus,
  BackendPurchaseOrderSummary,
  BackendSupplier,
  BackendUpdateSupplierPayload,
  CancelPurchaseOrderPayload,
  CreatePurchaseOrderPayload,
  CreateSupplierPayload,
  PurchaseOrderListParams,
  PurchaseOrderPageResponse,
  Supplier,
  SupplierDebt,
  SupplierIngredient,
  SupplierListParams,
  SupplierOrder,
  SupplierPageResponse,
  UpdatePurchaseOrderPayload,
  UpdateSupplierPayload,
} from '../types/supplier.types';

const normalizeOptionalText = (value?: string): string | undefined => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
};

const mapSupplier = (s: BackendSupplier): Supplier => ({
  id: s.id,
  name: s.name,
  code: s.code ?? '',
  taxCode: s.taxCode ?? '',
  address: s.address ?? '',
  phone: s.phone ?? '',
  email: s.email ?? '',
  contactPerson: s.contactName ?? '',
  bankAccount: '',
  bankName: '',
  isActive: s.active,
});

const mapPurchaseOrderStatus = (
  status: BackendPurchaseOrderStatus
): SupplierOrder['status'] => {
  if (status === 'RECEIVED') {
    return 'completed';
  }

  if (status === 'CANCELLED') {
    return 'cancelled';
  }

  return 'pending';
};

const mapPurchaseOrder = (order: BackendPurchaseOrderSummary): SupplierOrder => ({
  id: order.id,
  orderNumber: order.orderNumber,
  entryDate: order.createdAt,
  totalAmount: Number(order.totalAmount),
  status: mapPurchaseOrderStatus(order.status),
});

const toBackendCreatePayload = (payload: CreateSupplierPayload): BackendCreateSupplierPayload => ({
  name: payload.name.trim(),
  contactName: normalizeOptionalText(payload.contact_person),
  phone: normalizeOptionalText(payload.phone),
  email: normalizeOptionalText(payload.email),
  address: normalizeOptionalText(payload.address),
  taxCode: normalizeOptionalText(payload.tax_code),
});

const toBackendUpdatePayload = (
  payload: UpdateSupplierPayload,
  currentActive: boolean
): BackendUpdateSupplierPayload => ({
  ...toBackendCreatePayload({
    name: payload.name ?? '',
    tax_code: payload.tax_code ?? '',
    address: payload.address ?? '',
    phone: payload.phone ?? '',
    email: payload.email,
    contact_person: payload.contact_person,
    bank_account: payload.bank_account,
    bank_name: payload.bank_name,
  }),
  active: payload.is_active ?? currentActive,
});

const PURCHASE_ORDER_PAGE_SIZE = 100;

const getPurchaseOrderPage = async (
  params?: PurchaseOrderListParams
): Promise<PurchaseOrderPageResponse> => {
  const response = await api.get<ApiResponse<PurchaseOrderPageResponse>>('/purchase-orders', {
    params: {
      branchId: params?.branchId,
      status: params?.status,
      page: params?.page ?? 0,
      size: params?.size ?? PURCHASE_ORDER_PAGE_SIZE,
    },
  });

  return response.data.data;
};

const toBackendPurchaseOrderPayload = (
  payload: CreatePurchaseOrderPayload | UpdatePurchaseOrderPayload
): CreatePurchaseOrderPayload => ({
  supplierId: payload.supplierId,
  note: normalizeOptionalText(payload.note),
  expectedDate: normalizeOptionalText(payload.expectedDate),
  items: payload.items.map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    unit: normalizeOptionalText(item.unit),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    note: normalizeOptionalText(item.note),
  })),
});

/**
 * Lấy toàn bộ đơn mua hàng theo filter hiện có của backend.
 * Backend chưa hỗ trợ filter supplierId, nên FE tải các trang rồi lọc theo supplier.
 */
const getAllPurchaseOrders = async (
  params?: PurchaseOrderListParams
): Promise<BackendPurchaseOrderSummary[]> => {
  const firstPage = await getPurchaseOrderPage({
    ...params,
    page: 0,
    size: params?.size ?? PURCHASE_ORDER_PAGE_SIZE,
  });

  const remainingPageNumbers = Array.from(
    { length: Math.max(firstPage.totalPages - 1, 0) },
    (_, index) => index + 1
  );

  if (remainingPageNumbers.length === 0) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    remainingPageNumbers.map((page) =>
      getPurchaseOrderPage({
        ...params,
        page,
        size: params?.size ?? PURCHASE_ORDER_PAGE_SIZE,
      })
    )
  );

  return [firstPage.content, ...remainingPages.map((page) => page.content)].flat();
};

export const supplierService = {
  /**
   * Lấy danh sách nhà cung cấp từ API backend.
   */
  getList: async (params?: SupplierListParams): Promise<Supplier[]> => {
    const response = await api.get<ApiResponse<SupplierPageResponse>>('/suppliers', {
      params: {
        name: params?.name,
        page: params?.page ?? 0,
        size: params?.size ?? 100,
      },
    });

    return response.data.data.content.map(mapSupplier);
  },

  /**
   * Lấy chi tiết một nhà cung cấp.
   * Backend hiện chưa có endpoint detail, nên FE lấy từ danh sách active supplier.
   */
  getById: async (id: string): Promise<Supplier> => {
    const suppliers = await supplierService.getList({ size: 100 });
    const supplier = suppliers.find((item) => item.id === id);

    if (!supplier) {
      throw new Error('Không tìm thấy nhà cung cấp trong danh sách hiện có');
    }

    return supplier;
  },

  /**
   * Tạo nhà cung cấp mới
   */
  create: async (payload: CreateSupplierPayload): Promise<string> => {
    const response = await api.post<ApiResponse<string>>('/suppliers', toBackendCreatePayload(payload));
    return response.data.data;
  },

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  update: async (
    id: string,
    payload: UpdateSupplierPayload,
    currentActive: boolean
  ): Promise<void> => {
    await api.put<ApiResponse<void>>(`/suppliers/${id}`, toBackendUpdatePayload(payload, currentActive));
  },

  /**
   * Xóa nhà cung cấp
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  /**
   * Lấy lịch sử đơn mua hàng từ NCC.
   * Backend purchase order hiện chưa có query param `supplierId`, nên FE lọc client-side.
   */
  getOrders: async (id: string): Promise<SupplierOrder[]> => {
    const orders = await getAllPurchaseOrders();

    return orders
      .filter((order) => order.supplierId === id)
      .map(mapPurchaseOrder);
  },

  /**
   * Lấy danh sách đơn mua hàng từ API purchase-orders.
   */
  getPurchaseOrders: async (params?: PurchaseOrderListParams): Promise<PurchaseOrderPageResponse> => {
    return getPurchaseOrderPage(params);
  },

  /**
   * Lấy chi tiết một đơn mua hàng.
   */
  getPurchaseOrderDetail: async (id: string): Promise<BackendPurchaseOrderDetail> => {
    const response = await api.get<ApiResponse<BackendPurchaseOrderDetail>>(`/purchase-orders/${id}`);
    return response.data.data;
  },

  /**
   * Tạo đơn mua hàng mới ở trạng thái DRAFT.
   */
  createPurchaseOrder: async (payload: CreatePurchaseOrderPayload): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/purchase-orders',
      toBackendPurchaseOrderPayload(payload)
    );
    return response.data.data;
  },

  /**
   * Cập nhật đơn mua hàng khi còn DRAFT.
   */
  updatePurchaseOrder: async (id: string, payload: UpdatePurchaseOrderPayload): Promise<void> => {
    await api.put<ApiResponse<void>>(`/purchase-orders/${id}`, toBackendPurchaseOrderPayload(payload));
  },

  /**
   * Gửi đơn mua hàng cho nhà cung cấp.
   */
  sendPurchaseOrder: async (id: string): Promise<void> => {
    await api.post<ApiResponse<void>>(`/purchase-orders/${id}/send`);
  },

  /**
   * Xác nhận nhận hàng, backend sẽ tự tạo giao dịch nhập kho.
   */
  receivePurchaseOrder: async (id: string): Promise<void> => {
    await api.post<ApiResponse<void>>(`/purchase-orders/${id}/receive`);
  },

  /**
   * Hủy đơn mua hàng.
   */
  cancelPurchaseOrder: async (id: string, payload?: CancelPurchaseOrderPayload): Promise<void> => {
    await api.post<ApiResponse<void>>(`/purchase-orders/${id}/cancel`, payload);
  },

  /**
   * Lấy bảng giá nguyên liệu của NCC.
   * Backend supplier hiện chưa expose endpoint này.
   */
  getPriceList: async (id: string): Promise<SupplierIngredient[]> => {
    void id;
    return [];
  },

  /**
   * Lấy thông tin công nợ.
   * Backend supplier hiện chưa expose endpoint này.
   */
  getDebt: async (id: string): Promise<SupplierDebt | null> => {
    void id;
    return null;
  },

  /**
   * Tìm kiếm nhà cung cấp theo API list có filter tên của backend.
   */
  search: async (query: string): Promise<Supplier[]> => {
    return supplierService.getList({ name: query, size: 20 });
  },
};
