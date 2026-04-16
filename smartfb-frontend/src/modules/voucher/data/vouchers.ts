/**
 * @author Đào Thu Thiên
 * @description Mock danh sách voucher - có thể mutate
 * @created 2026-04-16
 */

import type { Voucher } from '../types/voucher.types';

// Khởi tạo mock data
let mockVouchersData: Voucher[] = [
    {
        id: 'voucher_001',
        tenantId: 'tenant_001',
        code: 'SUMMER30',
        name: 'Khuyến mãi hè 30%',
        discountType: 'PERCENT',
        discountValue: 30,
        minOrderValue: 100000,
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-08-31T23:59:59Z',
        status: 'ACTIVE',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
    },
    {
        id: 'voucher_002',
        tenantId: 'tenant_001',
        code: 'WELCOME50',
        name: 'Chào mừng thành viên mới',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000,
        minOrderValue: 200000,
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-12-31T23:59:59Z',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    },
];

// Export getter để luôn lấy data mới nhất
export const getMockVouchers = (): Voucher[] => {
    return mockVouchersData;
};

// Export các hàm mutation
export const addMockVoucher = (voucher: Voucher): void => {
    mockVouchersData = [...mockVouchersData, voucher];
};

export const updateMockVoucher = (id: string, updates: Partial<Voucher>): boolean => {
    const index = mockVouchersData.findIndex(v => v.id === id);
    if (index === -1) return false;

    mockVouchersData = [
        ...mockVouchersData.slice(0, index),
        { ...mockVouchersData[index], ...updates, updatedAt: new Date().toISOString() },
        ...mockVouchersData.slice(index + 1),
    ];
    return true;
};

export const deleteMockVoucher = (id: string): boolean => {
    const index = mockVouchersData.findIndex(v => v.id === id);
    if (index === -1) return false;

    mockVouchersData = [
        ...mockVouchersData.slice(0, index),
        ...mockVouchersData.slice(index + 1),
    ];
    return true;
};

// Reset mock data (cho testing)
export const resetMockVouchers = (): void => {
    mockVouchersData = [
        {
            id: 'voucher_001',
            tenantId: 'tenant_001',
            code: 'SUMMER30',
            name: 'Khuyến mãi hè 30%',
            discountType: 'PERCENT',
            discountValue: 30,
            minOrderValue: 100000,
            startDate: '2026-06-01T00:00:00Z',
            endDate: '2026-08-31T23:59:59Z',
            status: 'ACTIVE',
            createdAt: '2026-05-01T00:00:00Z',
            updatedAt: '2026-05-01T00:00:00Z',
        },
        {
            id: 'voucher_002',
            tenantId: 'tenant_001',
            code: 'WELCOME50',
            name: 'Chào mừng thành viên mới',
            discountType: 'FIXED_AMOUNT',
            discountValue: 50000,
            minOrderValue: 200000,
            startDate: '2026-01-01T00:00:00Z',
            endDate: '2026-12-31T23:59:59Z',
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        },
    ];
};

// Export mặc định để tương thích với code cũ
export const mockVouchers = getMockVouchers();