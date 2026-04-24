import { useQuery } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';

export const useSupplierDetail = (id?: string) => {
  // Lấy thông tin chi tiết NCC
  const { data: supplier, isLoading: isSupplierLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => (id ? supplierService.getById(id) : null),
    enabled: !!id,
  });

  // Lấy lịch sử đơn hàng
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['supplier-orders', id],
    queryFn: () => (id ? supplierService.getOrders(id) : []),
    enabled: !!id,
  });

  // Lấy bảng giá nguyên liệu
  const { data: priceList = [], isLoading: isPriceListLoading } = useQuery({
    queryKey: ['supplier-price-list', id],
    queryFn: () => (id ? supplierService.getPriceList(id) : []),
    enabled: !!id,
  });

  // Lấy thông tin công nợ
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
