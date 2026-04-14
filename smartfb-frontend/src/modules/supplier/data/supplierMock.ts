import { Supplier, SupplierIngredient, SupplierOrder } from '../types/supplier.types';

export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Công ty Thực phẩm Sạch ABC',
    code: 'NCC001',
    taxCode: '0101234567',
    address: '123 Đường Láng, Đống Đa, Hà Nội',
    phone: '0243123456',
    email: 'contact@abc-food.com',
    contactPerson: 'Nguyễn Văn A',
    bankAccount: '190012345678',
    bankName: 'Techcombank',
    isActive: true,
  },
  {
    id: '2',
    name: 'Nông trại Đà Lạt Xanh',
    code: 'NCC002',
    taxCode: '0309876543',
    address: '456 Phan Đình Phùng, Đà Lạt, Lâm Đồng',
    phone: '02633888999',
    email: 'info@dalatgreen.vn',
    contactPerson: 'Trần Thị B',
    bankAccount: '007100123456',
    bankName: 'Vietcombank',
    isActive: true,
  },
  {
    id: '3',
    name: 'Đại lý Sữa & Phụ liệu Hải Nam',
    code: 'NCC003',
    taxCode: '0401122334',
    address: '789 Nguyễn Văn Linh, Đà Nẵng',
    phone: '02363555666',
    email: 'hainam-dairy@gmail.com',
    contactPerson: 'Lê Văn C',
    bankAccount: '123456789',
    bankName: 'BIDV',
    isActive: false,
  },
];

export const mockSupplierIngredients: Record<string, SupplierIngredient[]> = {
  '1': [
    { id: 'i1', ingredientId: 'ing1', ingredientName: 'Thịt bò thắt lưng', price: 250000, minimumOrderQty: 5, isPreferred: true },
    { id: 'i2', ingredientId: 'ing2', ingredientName: 'Ức gà phi lê', price: 85000, minimumOrderQty: 10, isPreferred: false },
  ],
  '2': [
    { id: 'i3', ingredientId: 'ing3', ingredientName: 'Xà lách thủy canh', price: 45000, minimumOrderQty: 2, isPreferred: true },
    { id: 'i4', ingredientId: 'ing4', ingredientName: 'Cà chua bi', price: 35000, minimumOrderQty: 3, isPreferred: true },
  ],
};

export const mockSupplierOrders: Record<string, SupplierOrder[]> = {
  '1': [
    { id: 'o1', orderNumber: 'PO-2024-001', entryDate: '2024-03-15', totalAmount: 1250000, status: 'completed' },
    { id: 'o2', orderNumber: 'PO-2024-005', entryDate: '2024-04-01', totalAmount: 850000, status: 'pending' },
  ],
};
