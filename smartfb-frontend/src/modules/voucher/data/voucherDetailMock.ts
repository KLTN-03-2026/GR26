/**
 * @author Đào Thu Thiên
 * @description Mock chi tiết voucher
 * @created 2026-04-16
 */

import type { Voucher } from '../types/voucher.types';

export const mockVoucherDetail: Voucher = {
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
};