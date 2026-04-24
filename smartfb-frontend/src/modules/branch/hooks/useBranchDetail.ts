import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchDetailMock } from '@modules/branch/data/branchDetailMock';
import { shiftScheduleMock } from '@modules/branch/data/shiftScheduleMock';
import { branchActivityLogsMock } from '@modules/branch/data/branchActivityLogsMock';

/**
 * Hook lấy chi tiết chi nhánh theo ID.
 * Hiện tại dùng mock data, sẽ thay bằng API call sau.
 *
 * @param branchId - ID chi nhánh cần lấy thông tin
 * @returns Query result với thông tin chi tiết chi nhánh
 */
export const useBranchDetail = (branchId: string) => {
  return useQuery({
    queryKey: queryKeys.branches.detail(branchId),
    queryFn: async () => {
      // TODO: Thay bằng API call thực tế
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Mock: trả về cùng 1 branch cho mọi ID
      if (branchId !== branchDetailMock.id) {
        throw new Error('Branch not found');
      }

      return {
        branch: branchDetailMock,
        shifts: shiftScheduleMock,
        activityLogs: branchActivityLogsMock,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};
