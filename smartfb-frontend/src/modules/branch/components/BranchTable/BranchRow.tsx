import { MoreHorizontal } from 'lucide-react';
import { TableRow, TableCell } from '@shared/components/ui/table';
import type { BranchListItem } from '../../types/branch.types';

interface BranchRowProps {
  branch: BranchListItem;
}

/**
 * Row hiển thị thông tin một chi nhánh trong bảng
 */
export const BranchRow = ({ branch }: BranchRowProps) => {
  return (
    <TableRow className="border-b-gray-200 box">
      <TableCell className="font-medium text-gray-900 truncate">
        {branch.name}
      </TableCell>
      <TableCell className="text-gray-600 text-sm truncate">
        {branch.address}
      </TableCell>
      <TableCell>
        <span
          className={`badge ${
            branch.status === 'active'
              ? 'badge-completed'
              : 'badge-warning'
          }`}
        >
          {branch.status === 'active' ? 'Đang hoạt động' : 'Tạm nghỉ'}
        </span>
      </TableCell>
      <TableCell className="font-medium text-gray-900">
        {branch.revenueDisplay}đ
      </TableCell>
      <TableCell className="text-center">{branch.staff ?? '0'}</TableCell>
      <TableCell className="text-right">
        <button className="btn-ghost p-2 rounded-lg hover:bg-gray-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </TableCell>
    </TableRow>
  );
};
