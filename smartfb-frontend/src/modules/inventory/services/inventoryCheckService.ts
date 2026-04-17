/**
 * @author Đào Thu Thiên
 * @description Service cho module Kiểm kho (PB31)
 * @created 2026-04-16
 * 
 * HIỆN TẠI ĐANG DÙNG MOCK DATA (vì API chưa có)
 */

import type {
    InventoryCheckSession,
    InventoryCheckDetail,
    CreateInventoryCheckRequest,
    UpdateCheckDetailRequest,
    SubmitInventoryCheckRequest,
    CancelInventoryCheckRequest,
    DeviationReport,
    InventoryCheckFilters,
    InventoryCheckListResult,
} from '../types/inventoryCheck.types';


// Lấy thông tin user hiện tại từ localStorage (để mock submittedByName)
const getCurrentUserMock = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return {
                id: user.id || 'current-user',
                name: user.fullName || user.name || 'Người dùng hiện tại',
            };
        }
    } catch (e) {
        console.error('Failed to parse user from localStorage', e);
    }
    return { id: 'current-user', name: 'Người dùng hiện tại' };
};

// Mock danh sách phiếu kiểm kho
let mockSessions: InventoryCheckSession[] = [
    {
        id: 'check-001',
        branchId: 'branch-1',
        branchName: 'Chi nhánh Trung Tâm',
        checkDate: new Date().toISOString(),
        status: 'DRAFT',
        systemSnapshotDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'check-002',
        branchId: 'branch-1',
        branchName: 'Chi nhánh Trung Tâm',
        checkDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'SUBMITTED',
        systemSnapshotDate: new Date(Date.now() - 86400000).toISOString(),
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        submittedBy: 'user-001',
        submittedByName: 'Nguyễn Văn A',
        totalDeviationValue: 1250000,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
];

// Mock chi tiết nguyên liệu cho phiếu
const mockDetailsMap: Map<string, InventoryCheckDetail[]> = new Map();

// Hàm tạo mock details cho một session
const generateMockDetails = (sessionId: string): InventoryCheckDetail[] => {
    return [
        {
            id: `${sessionId}-item-1`,
            sessionId,
            itemId: 'item-1',
            itemName: 'Thịt bò',
            unit: 'kg',
            systemQuantity: 150,
            actualQuantity: null,
            deviationQuantity: null,
            deviationValue: null,
            costPerUnit: 250000,
            note: undefined,
        },
        {
            id: `${sessionId}-item-2`,
            sessionId,
            itemId: 'item-2',
            itemName: 'Tôm sú',
            unit: 'kg',
            systemQuantity: 80,
            actualQuantity: null,
            deviationQuantity: null,
            deviationValue: null,
            costPerUnit: 450000,
            note: undefined,
        },
        {
            id: `${sessionId}-item-3`,
            sessionId,
            itemId: 'item-3',
            itemName: 'Rau xà lách',
            unit: 'kg',
            systemQuantity: 200,
            actualQuantity: null,
            deviationQuantity: null,
            deviationValue: null,
            costPerUnit: 12000,
            note: undefined,
        },
        {
            id: `${sessionId}-item-4`,
            sessionId,
            itemId: 'item-4',
            itemName: 'Phô mai',
            unit: 'kg',
            systemQuantity: 45,
            actualQuantity: null,
            deviationQuantity: null,
            deviationValue: null,
            costPerUnit: 80000,
            note: undefined,
        },
        {
            id: `${sessionId}-item-5`,
            sessionId,
            itemId: 'item-5',
            itemName: 'Thịt gà',
            unit: 'kg',
            systemQuantity: 120,
            actualQuantity: null,
            deviationQuantity: null,
            deviationValue: null,
            costPerUnit: 35000,
            note: undefined,
        },
    ];
};

// Helper lấy hoặc tạo mock details
const getOrCreateMockDetails = (sessionId: string): InventoryCheckDetail[] => {
    if (!mockDetailsMap.has(sessionId)) {
        mockDetailsMap.set(sessionId, generateMockDetails(sessionId));
    }
    return mockDetailsMap.get(sessionId)!;
};

// Helper kiểm tra có phiếu DRAFT không
const hasDraftSession = (branchId: string): boolean => {
    return mockSessions.some(s => s.branchId === branchId && s.status === 'DRAFT');
};

// ============ Service ============

export const inventoryCheckService = {
    /**
     * GET /api/v1/inventory/checks
     * Lấy danh sách phiếu kiểm kho (có phân trang)
     */
    getSessions: async (filters?: InventoryCheckFilters): Promise<InventoryCheckListResult> => {
        console.log('[MOCK] getSessions called with filters:', filters);

        let filteredSessions = [...mockSessions];

        if (filters?.branchId) {
            filteredSessions = filteredSessions.filter(s => s.branchId === filters.branchId);
        }
        if (filters?.status) {
            filteredSessions = filteredSessions.filter(s => s.status === filters.status);
        }

        filteredSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const page = filters?.page ?? 0;
        const size = filters?.size ?? 20;
        const start = page * size;
        const paginatedData = filteredSessions.slice(start, start + size);

        return {
            data: paginatedData,
            totalElements: filteredSessions.length,
            totalPages: Math.ceil(filteredSessions.length / size),
            page: page,
            size: size,
        };
    },

    /**
     * GET /api/v1/inventory/checks/{id}
     * Lấy chi tiết một phiếu kiểm kho
     */
    getSessionById: async (id: string): Promise<InventoryCheckSession> => {
        console.log('[MOCK] getSessionById called with id:', id);

        const session = mockSessions.find(s => s.id === id);
        if (!session) {
            throw new Error('Không tìm thấy phiếu kiểm kho');
        }
        return session;
    },

    /**
     * GET /api/v1/inventory/checks/{sessionId}/details
     * Lấy danh sách chi tiết nguyên liệu của một phiếu kiểm
     */
    getDetails: async (sessionId: string): Promise<InventoryCheckDetail[]> => {
        console.log('[MOCK] getDetails called for session:', sessionId);
        return getOrCreateMockDetails(sessionId);
    },

    /**
     * POST /api/v1/inventory/checks
     * Tạo phiếu kiểm kho mới
     */
    createSession: async (data: CreateInventoryCheckRequest): Promise<InventoryCheckSession> => {
        console.log('[MOCK] createSession called with data:', data);

        if (hasDraftSession(data.branchId)) {
            throw new Error('Chi nhánh đang có phiếu kiểm kho chưa hoàn tất. Vui lòng hoàn thành hoặc hủy phiếu hiện tại.');
        }

        const currentUser = getCurrentUserMock();

        const newSession: InventoryCheckSession = {
            id: `check-${Date.now()}`,
            branchId: data.branchId,
            branchName: data.branchId === 'branch-1' ? 'Chi nhánh Trung Tâm' : 'Chi nhánh Cầu Giấy',
            checkDate: new Date().toISOString(),
            status: 'DRAFT',
            systemSnapshotDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            submittedBy: currentUser.id,
            submittedByName: currentUser.name,
        };

        mockSessions.push(newSession);
        mockDetailsMap.set(newSession.id, generateMockDetails(newSession.id));

        return newSession;
    },

    /**
     * PUT /api/v1/inventory/checks/{sessionId}/details/{itemId}
     * Cập nhật số lượng thực tế cho một nguyên liệu
     */
    updateDetail: async (
        sessionId: string,
        itemId: string,
        data: UpdateCheckDetailRequest
    ): Promise<InventoryCheckDetail> => {
        console.log('[MOCK] updateDetail called:', { sessionId, itemId, data });

        if (data.actualQuantity < 0) {
            throw new Error('Số lượng thực tế không được nhập số âm');
        }

        const details = getOrCreateMockDetails(sessionId);
        const detailIndex = details.findIndex(d => d.itemId === itemId);

        if (detailIndex === -1) {
            throw new Error('Không tìm thấy nguyên liệu trong phiếu kiểm');
        }

        const detail = details[detailIndex];
        const deviationQuantity = data.actualQuantity - detail.systemQuantity;
        const deviationValue = deviationQuantity * detail.costPerUnit;

        const updatedDetail: InventoryCheckDetail = {
            ...detail,
            actualQuantity: data.actualQuantity,
            deviationQuantity,
            deviationValue,
            note: data.note,
        };

        details[detailIndex] = updatedDetail;
        mockDetailsMap.set(sessionId, details);

        const totalDeviation = details.reduce((sum, d) => sum + (d.deviationValue || 0), 0);
        const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            mockSessions[sessionIndex] = {
                ...mockSessions[sessionIndex],
                totalDeviationValue: totalDeviation,
                updatedAt: new Date().toISOString(),
            };
        }

        return updatedDetail;
    },

    /**
     * POST /api/v1/inventory/checks/{sessionId}/submit
     * Nộp phiếu kiểm kho
     */
    submitSession: async (sessionId: string, data: SubmitInventoryCheckRequest): Promise<InventoryCheckSession> => {
        console.log('[MOCK] submitSession called:', { sessionId, data });

        const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) {
            throw new Error('Không tìm thấy phiếu kiểm kho');
        }

        const session = mockSessions[sessionIndex];
        if (session.status !== 'DRAFT') {
            throw new Error('Phiếu kiểm kho đã được nộp hoặc không còn hiệu lực');
        }

        const details = getOrCreateMockDetails(sessionId);

        // Kiểm tra đã nhập đủ số lượng
        const missingItems = details.filter(d => d.actualQuantity === null);
        if (missingItems.length > 0) {
            throw new Error(`Vui lòng nhập số lượng thực tế cho tất cả nguyên liệu (còn ${missingItems.length} nguyên liệu chưa nhập)`);
        }

        // 🔧 SỬA LỖI 1: Kiểm tra từng item vượt ngưỡng có note không
        const itemsExceedThresholdWithoutNote = details.filter(d => {
            if (d.actualQuantity === null) return false;
            const deviationPercent = Math.abs((d.deviationQuantity || 0) / d.systemQuantity * 100);
            // Nếu vượt ngưỡng 10% và KHÔNG có ghi chú thì báo lỗi
            return deviationPercent > 10 && !d.note;
        });

        if (itemsExceedThresholdWithoutNote.length > 0) {
            const itemNames = itemsExceedThresholdWithoutNote.map(i => i.itemName).join(', ');
            throw new Error(`Chênh lệch vượt quá ngưỡng cho phép (10%) đối với nguyên liệu: ${itemNames}. Vui lòng nhập ghi chú giải thích trước khi nộp.`);
        }

        const currentUser = getCurrentUserMock();

        const updatedSession: InventoryCheckSession = {
            ...session,
            status: 'SUBMITTED',
            submittedAt: new Date().toISOString(),
            submittedBy: currentUser.id,
            submittedByName: currentUser.name,
            notes: data.notes,
            updatedAt: new Date().toISOString(),
        };

        mockSessions[sessionIndex] = updatedSession;

        return updatedSession;
    },

    /**
     * POST /api/v1/inventory/checks/{sessionId}/cancel
     * Hủy phiếu kiểm kho
     */
    cancelSession: async (sessionId: string, data: CancelInventoryCheckRequest): Promise<InventoryCheckSession> => {
        console.log('[MOCK] cancelSession called:', { sessionId, data });

        const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) {
            throw new Error('Không tìm thấy phiếu kiểm kho');
        }

        const session = mockSessions[sessionIndex];
        if (session.status !== 'DRAFT') {
            throw new Error('Chỉ có thể hủy phiếu kiểm kho đang ở trạng thái DRAFT');
        }

        const updatedSession: InventoryCheckSession = {
            ...session,
            status: 'CANCELLED',
            notes: data.reason,
            updatedAt: new Date().toISOString(),
        };

        mockSessions[sessionIndex] = updatedSession;

        return updatedSession;
    },

    /**
     * GET /api/v1/inventory/checks/{sessionId}/deviation-report
     * Lấy báo cáo lệch kho
     */
    getDeviationReport: async (sessionId: string): Promise<DeviationReport> => {
        console.log('[MOCK] getDeviationReport called for session:', sessionId);

        const session = await inventoryCheckService.getSessionById(sessionId);
        const details = getOrCreateMockDetails(sessionId);

        const deviations = details
            .filter(d => d.actualQuantity !== null && d.deviationQuantity !== 0)
            .map(d => ({
                itemId: d.itemId,
                itemName: d.itemName,
                unit: d.unit,
                systemQuantity: d.systemQuantity,
                actualQuantity: d.actualQuantity!,
                deviationQuantity: d.deviationQuantity!,
                deviationValue: d.deviationValue!,
                deviationPercentage: (d.deviationQuantity! / d.systemQuantity) * 100,
                note: d.note,
            }));

        const totalDeviationValue = deviations.reduce((sum, d) => sum + d.deviationValue, 0);

        return {
            sessionId: session.id,
            session,
            deviations,
            totalDeviationValue,
            checkedBy: session.submittedBy || 'user-001',
            checkedByName: session.submittedByName || 'Người kiểm',
            checkedAt: session.submittedAt || new Date().toISOString(),
        };
    },
};