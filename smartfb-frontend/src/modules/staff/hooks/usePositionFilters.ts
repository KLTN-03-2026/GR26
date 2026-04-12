import { useMemo, useState } from 'react';
import type {
  StaffPosition,
  StaffPositionListItem,
  StaffPositionSummary,
} from '@modules/staff/types/position.types';
import type { StaffSummary } from '@modules/staff/types/staff.types';

interface UsePositionFiltersResult {
  keyword: string;
  setKeyword: (value: string) => void;
  clearKeyword: () => void;
  hasActiveFilters: boolean;
  positions: StaffPositionListItem[];
  summary: StaffPositionSummary;
}

/**
 * Hook gom logic filter/search danh sách chức vụ để page chỉ còn xử lý điều hướng và bố cục.
 */
export const usePositionFilters = (
  rawPositions: StaffPosition[],
  staffList: StaffSummary[]
): UsePositionFiltersResult => {
  const [keyword, setKeyword] = useState('');

  // FE suy ra số nhân sự đang gán vào từng chức vụ từ danh sách staff hiện tại.
  const positions = useMemo<StaffPositionListItem[]>(() => {
    const staffCountByPositionId = staffList.reduce<Record<string, number>>((result, staff) => {
      if (!staff.positionId) {
        return result;
      }

      result[staff.positionId] = (result[staff.positionId] ?? 0) + 1;
      return result;
    }, {});

    return rawPositions.map((position) => ({
      ...position,
      assignedStaffCount: staffCountByPositionId[position.id] ?? 0,
    }));
  }, [rawPositions, staffList]);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredPositions = useMemo(() => {
    if (!normalizedKeyword) {
      return positions;
    }

    return positions.filter((position) => {
      const searchableText = [position.name, position.description ?? '']
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });
  }, [normalizedKeyword, positions]);

  const summary = useMemo<StaffPositionSummary>(() => {
    const usedPositions = positions.filter((position) => position.assignedStaffCount > 0).length;

    return {
      totalPositions: positions.length,
      usedPositions,
      vacantPositions: positions.length - usedPositions,
    };
  }, [positions]);

  return {
    keyword,
    setKeyword,
    clearKeyword: () => setKeyword(''),
    hasActiveFilters: Boolean(normalizedKeyword),
    positions: filteredPositions,
    summary,
  };
};
