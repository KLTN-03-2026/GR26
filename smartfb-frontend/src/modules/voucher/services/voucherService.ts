/**
 * @author Đào Thu Thiên
 * @description Service quản lý voucher (mock data)
 * @created 2026-04-16
 */

import type {
    Voucher,
    CreateVoucherPayload,
    UpdateVoucherPayload,
    UpdateVoucherStatusPayload,
} from '../types/voucher.types';
import type { ApiResponse } from '@shared/types/api.types';

// Import mock data functions
import {
    getMockVouchers,
    addMockVoucher,
    updateMockVoucher,
    deleteMockVoucher
} from '../data/vouchers';

// Delay giả lập network
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const voucherService = {
    /**
     * Lấy danh sách voucher của tenant hiện tại
     */
    getList: async (): Promise<ApiResponse<Voucher[]>> => {
        await delay();
        const data = getMockVouchers(); // Luôn lấy data mới nhất
        return {
            success: true,
            data: data,
            message: 'Lấy danh sách voucher thành công',
        };
    },

    /**
     * Lấy chi tiết voucher theo ID
     */
    getById: async (id: string): Promise<ApiResponse<Voucher>> => {
        await delay();
        const voucher = getMockVouchers().find(v => v.id === id);

        if (!voucher) {
            return {
                success: false,
                data: null as any,
                message: 'Không tìm thấy voucher',
            };
        }

        return {
            success: true,
            data: voucher,
            message: 'Lấy chi tiết voucher thành công',
        };
    },

    /**
     * Tạo mới voucher
     */
    create: async (payload: CreateVoucherPayload): Promise<ApiResponse<Voucher>> => {
        await delay();

        // Kiểm tra trùng mã voucher
        const existingVoucher = getMockVouchers().find(v => v.code === payload.code);
        if (existingVoucher) {
            return {
                success: false,
                data: null as any,
                message: 'Mã voucher đã tồn tại',
            };
        }

        const newVoucher: Voucher = {
            id: `voucher_${Date.now()}`,
            tenantId: 'tenant_001',
            ...payload,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        addMockVoucher(newVoucher);

        return {
            success: true,
            data: newVoucher,
            message: 'Tạo voucher thành công',
        };
    },

    /**
     * Cập nhật thông tin voucher
     */
    update: async (id: string, payload: UpdateVoucherPayload): Promise<ApiResponse<Voucher>> => {
        await delay();

        const success = updateMockVoucher(id, payload);

        if (!success) {
            return {
                success: false,
                data: null as any,
                message: 'Không tìm thấy voucher',
            };
        }

        const updatedVoucher = getMockVouchers().find(v => v.id === id);

        return {
            success: true,
            data: updatedVoucher!,
            message: 'Cập nhật voucher thành công',
        };
    },

    /**
     * Cập nhật trạng thái voucher (kích hoạt/vô hiệu hóa)
     */
    updateStatus: async (id: string, payload: UpdateVoucherStatusPayload): Promise<ApiResponse<Voucher>> => {
        await delay();

        const success = updateMockVoucher(id, { status: payload.status });

        if (!success) {
            return {
                success: false,
                data: null as any,
                message: 'Không tìm thấy voucher',
            };
        }

        const updatedVoucher = getMockVouchers().find(v => v.id === id);

        return {
            success: true,
            data: updatedVoucher!,
            message: 'Cập nhật trạng thái voucher thành công',
        };
    },

    /**
     * Xóa voucher
     */
    delete: async (id: string): Promise<ApiResponse<void>> => {
        await delay();

        const success = deleteMockVoucher(id);

        if (!success) {
            return {
                success: false,
                data: null as any,
                message: 'Không tìm thấy voucher',
            };
        }

        return {
            success: true,
            data: undefined,
            message: 'Xóa voucher thành công',
        };
    },
};