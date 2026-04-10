import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffDetailMock } from '@modules/staff/data/staffDetailMock';
import { staffShiftScheduleMock } from '@modules/staff/data/shiftScheduleMock';
import { staffActivityLogsMock } from '@modules/staff/data/staffActivityLogsMock';

/**
 * Hook lấy chi tiết nhân viên theo ID.
 * Hiện tại dùng mock data, sẽ thay bằng API call sau.
 *
 * @param staffId - ID nhân viên cần lấy thông tin
 * @returns Query result với thông tin chi tiết nhân viên
 */
export const useStaffDetail = (staffId: string) => {
  return useQuery({
    queryKey: queryKeys.staff.detail(staffId),
    queryFn: async () => {
      // TODO: Thay bằng API call thực tế
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Mock: trả về cùng 1 staff cho mọi ID
      if (staffId !== staffDetailMock.id) {
        throw new Error('Staff not found');
      }

      return {
        staff: staffDetailMock,
        shifts: staffShiftScheduleMock,
        activityLogs: staffActivityLogsMock,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};
