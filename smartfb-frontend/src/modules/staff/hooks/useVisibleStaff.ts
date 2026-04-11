import { useMemo } from 'react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROLES } from '@shared/constants/roles';
import type { StaffSummary } from '../types/staff.types';
import { filterVisibleStaffByViewerRole } from '../utils/filterVisibleStaffByViewerRole';

/**
 * Hook trả về danh sách nhân sự được phép hiển thị theo role người đăng nhập.
 * Owner sẽ không nhìn thấy tài khoản owner trong khu quản lý nhân sự.
 */
export const useVisibleStaff = (staffList: StaffSummary[]): StaffSummary[] => {
  const viewerRole = useAuthStore((state) => state.user?.role ?? ROLES.STAFF);
  const viewerUserId = useAuthStore((state) => state.user?.id ?? null);

  return useMemo(() => {
    return filterVisibleStaffByViewerRole({
      staffList,
      viewerRole,
      viewerUserId,
    });
  }, [staffList, viewerRole, viewerUserId]);
};
