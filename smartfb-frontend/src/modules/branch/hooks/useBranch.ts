import { useBranchDetail } from './useBranchDetail';

/**
 * Hook lấy thông tin chi tiết một chi nhánh theo ID
 *
 * @param branchId - ID chi nhánh cần lấy thông tin
 * @returns Thông tin chi nhánh và loading/error states
 */
export const useBranch = (branchId: string) => useBranchDetail(branchId);
