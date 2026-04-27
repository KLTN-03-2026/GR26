import { useMemo, useState } from 'react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import type { Branch } from '@modules/branch/types/branch.types';
import type { DateRangePickerValue } from '@shared/components/common/DateRangePicker';
import { buildTodayDateRangeValue, getTodayDateValue } from '@shared/utils/datePresets';

export interface ReportBranchOption {
  value: string;
  label: string;
  status: Branch['status'];
}

/**
 * Hook quản lý filter cho màn báo cáo doanh thu.
 * FE chủ động ép chọn 1 chi nhánh vì backend hiện mới trả dữ liệu ổn định nhất theo branch.
 *
 * @returns State filter, branch options và trạng thái load danh sách chi nhánh
 */
export const useRevenueReportFilters = () => {
  const currentBranchId = useAuthStore((state) => state.session?.branchId ?? null);
  const {
    data: branches = [],
    isLoading,
    isError,
    refetch,
  } = useBranches();

  const [manualBranchId, setManualBranchId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRangePickerValue>(() => buildTodayDateRangeValue());
  const [analysisDate, setAnalysisDate] = useState<string>(() => getTodayDateValue());

  const branchOptions = useMemo<ReportBranchOption[]>(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: branch.status === 'ACTIVE' ? branch.name : `${branch.name} (ngừng hoạt động)`,
        status: branch.status,
      })),
    [branches],
  );

  const selectedBranchId = useMemo(() => {
    const hasManualBranch = branches.some((branch) => branch.id === manualBranchId);
    if (hasManualBranch) {
      return manualBranchId;
    }

    const currentBranch = currentBranchId
      ? branches.find((branch) => branch.id === currentBranchId)
      : undefined;

    return currentBranch?.id ?? branches[0]?.id ?? '';
  }, [branches, currentBranchId, manualBranchId]);

  const selectedBranch = useMemo<Branch | null>(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

  return {
    branches,
    branchOptions,
    selectedBranchId,
    selectedBranch,
    dateRange,
    analysisDate,
    isBranchLoading: isLoading,
    isBranchError: isError,
    setSelectedBranchId: setManualBranchId,
    setDateRange,
    setAnalysisDate,
    refetchBranches: refetch,
  } as const;
};
