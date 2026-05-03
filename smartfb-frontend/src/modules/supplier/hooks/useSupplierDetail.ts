import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { supplierService } from '../services/supplierService';

export const useSupplierDetail = (id?: string) => {
  // Lấy thông tin chi tiết NCC
  const { data: supplier, isLoading: isSupplierLoading } = useQuery({
    queryKey: id ? queryKeys.suppliers.detail(id) : queryKeys.suppliers.detail('unknown'),
    queryFn: () => (id ? supplierService.getById(id) : null),
    enabled: !!id,
  });

  // Lấy đơn mua hàng thật từ purchase-order API rồi lọc theo nhà cung cấp.
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: id ? queryKeys.suppliers.orders(id) : queryKeys.suppliers.orders('unknown'),
    queryFn: () => (id ? supplierService.getOrders(id) : []),
    enabled: !!id,
  });

  // Backend supplier hiện chưa có endpoint bảng giá nguyên liệu theo NCC.
  const { data: priceList = [], isLoading: isPriceListLoading } = useQuery({
    queryKey: ['supplier-price-list', id],
    queryFn: () => (id ? supplierService.getPriceList(id) : []),
    enabled: !!id,
  });

  // Backend supplier hiện chưa có endpoint công nợ theo NCC.
  const { data: debt, isLoading: isDebtLoading } = useQuery({
    queryKey: ['supplier-debt', id],
    queryFn: () => (id ? supplierService.getDebt(id) : null),
    enabled: !!id,
  });

  return {
    supplier,
    orders,
    priceList,
    debt,
    isLoading: isSupplierLoading || isOrdersLoading || isPriceListLoading || isDebtLoading,
    isSupplierLoading,
    isOrdersLoading,
    isPriceListLoading,
    isDebtLoading,
  };
};
