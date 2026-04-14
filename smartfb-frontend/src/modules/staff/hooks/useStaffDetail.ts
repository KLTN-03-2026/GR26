import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import { shiftService } from '../services/shiftService';

/**
 * Hook lấy chi tiết nhân viên theo ID từ API thực tế.
 * 
 * @param staffId - ID nhân viên cần lấy thông tin
 */
export const useStaffDetail = (staffId: string) => {
  return useQuery({
    queryKey: queryKeys.staff.detail(staffId),
    queryFn: async () => {
      const staffRes = await staffService.getById(staffId);
      
      // Lấy thêm lịch làm việc (nếu cần mockup logs thì để rỗng trước)
      // Backend có thể gộp hoặc tách, ở đây tách theo pattern cũ
      const scheduleRes = await shiftService.getSchedule({ branchId: staffRes.data.branchId, date: new Date().toISOString() });

      return {
        staff: staffRes.data,
        shifts: scheduleRes.data || [],
        activityLogs: [], // Sẽ được bổ sung khi có API audit trail
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!staffId,
  });
};
