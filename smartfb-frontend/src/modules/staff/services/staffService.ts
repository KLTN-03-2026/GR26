// import { api } from '@lib/axios';
import type { StaffDetailFull } from '../data/staffDetailMock';
import type { EditStaffFormData, CreateStaffFormData } from '../types/staff.types';
import type { ApiResponse } from '@shared/types/api.types';
import { mockStaffList, type StaffDetail } from '../data/staffList';
import { staffDetailMock } from '../data/staffDetailMock';

// In-memory storage cho mock data để CRUD hoạt động
let inMemoryStaffList: StaffDetail[] = [...mockStaffList];
let inMemoryStaffDetail: StaffDetailFull = { ...staffDetailMock };

// Helper tạo ID mới
const generateId = () => `staff-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

/**
 * Staff service - gọi API cho các thao tác nhân viên
 */
export const staffService = {
  /**
   * Lấy danh sách nhân viên
   */
  getList: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...inMemoryStaffList];
  },

  /**
   * Lấy chi tiết một nhân viên
   */
  getById: async (id: string): Promise<ApiResponse<StaffDetailFull>> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Tìm trong danh sách trước
    const foundStaff = inMemoryStaffList.find(s => s.id === id);
    
    if (foundStaff) {
      const fullDetail: StaffDetailFull = {
        id: foundStaff.id,
        firstName: foundStaff.firstName,
        lastName: foundStaff.lastName,
        email: foundStaff.email,
        phone: foundStaff.phone,
        identityId: inMemoryStaffDetail.identityId || '123456789012',
        dateOfBirth: inMemoryStaffDetail.dateOfBirth || '1990-01-01',
        address: inMemoryStaffDetail.address || 'Chưa cập nhật',
        city: inMemoryStaffDetail.city || 'Chưa cập nhật',
        status: foundStaff.status,
        role: foundStaff.role,
        department: foundStaff.department,
        branchId: foundStaff.branchId,
        branchName: foundStaff.branchName,
        shiftType: foundStaff.shiftType,
        hireDate: foundStaff.hireDate,
        salary: foundStaff.salary,
        attendanceRate: foundStaff.attendanceRate,
        pinPos: inMemoryStaffDetail.pinPos || '1234',
        manager: inMemoryStaffDetail.manager,
        avatar: inMemoryStaffDetail.avatar,
        createdAt: foundStaff.hireDate,
      };
      return { success: true, data: fullDetail };
    }

    throw new Error('Không tìm thấy nhân viên');
  },

  /**
   * Tạo nhân viên mới
   */
  create: async (payload: CreateStaffFormData): Promise<ApiResponse<StaffDetailFull>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newId = generateId();
    
    const newStaff: StaffDetail = {
      id: newId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      status: payload.status,
      role: payload.role,
      department: payload.department,
      branchId: payload.branchId,
      branchName: payload.branchName,
      shiftType: payload.shiftType,
      hireDate: payload.hireDate,
      salary: payload.salary,
      attendanceRate: 100,
    };

    inMemoryStaffList = [newStaff, ...inMemoryStaffList];

    const newStaffFull: StaffDetailFull = {
      ...newStaff,
      identityId: payload.identityId,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      city: payload.city,
      pinPos: payload.pinPos,
      createdAt: new Date().toISOString(),
      attendanceRate: 100,
    };

    return { success: true, data: newStaffFull };
  },

  /**
   * Cập nhật thông tin nhân viên
   */
  update: async (id: string, payload: EditStaffFormData): Promise<ApiResponse<StaffDetailFull>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Cập nhật trong danh sách
    const index = inMemoryStaffList.findIndex(s => s.id === id);
    if (index !== -1) {
      inMemoryStaffList[index] = {
        ...inMemoryStaffList[index],
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        department: payload.department,
        shiftType: payload.shiftType,
        salary: payload.salary,
      };
    }

    // Cập nhật chi tiết
    if (id === inMemoryStaffDetail.id) {
      inMemoryStaffDetail = {
        ...inMemoryStaffDetail,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        identityId: payload.identityId,
        dateOfBirth: payload.dateOfBirth,
        address: payload.address,
        city: payload.city,
        role: payload.role,
        department: payload.department,
        shiftType: payload.shiftType,
        salary: payload.salary,
      };
    }

    const updatedStaff = await staffService.getById(id);
    return updatedStaff;
  },

  /**
   * Xóa / Deactivate nhân viên
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    inMemoryStaffList = inMemoryStaffList.filter(s => s.id !== id);
    return { success: true, data: undefined };
  },

  /**
   * Cập nhật trạng thái nhân viên (khóa/mở khóa)
   */
  updateStatus: async (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<StaffDetailFull>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = inMemoryStaffList.findIndex(s => s.id === id);
    if (index !== -1) {
      inMemoryStaffList[index] = {
        ...inMemoryStaffList[index],
        status,
      };
    }

    if (id === inMemoryStaffDetail.id) {
      inMemoryStaffDetail = {
        ...inMemoryStaffDetail,
        status,
      };
    }
    
    const updatedStaff = await staffService.getById(id);
    return updatedStaff;
  },

  /**
   * Lấy danh sách nhân viên theo chi nhánh
   */
  getByBranch: async (branchId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return inMemoryStaffList.filter(staff => staff.branchId === branchId);
  },
};