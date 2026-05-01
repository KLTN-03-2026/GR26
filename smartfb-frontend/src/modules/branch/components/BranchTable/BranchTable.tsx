import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import type { BranchListItem } from '../../types/branch.types';
import { BranchRow } from './BranchRow';
import { BranchTablePagination } from './BranchTablePagination';

interface BranchTableProps {
  branches: BranchListItem[];
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Table hiển thị danh sách chi nhánh dùng shadcn/ui
 */
export const BranchTable = ({
  branches,
  currentPage,
  totalPages,
  totalItems = 0,
  onPageChange,
  isLoading = false,
}: BranchTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy chi nhánh nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader className="border-0">
            <TableRow className="hover:bg-cream border-b-0">
              <TableHead>CHI NHÁNH</TableHead>
              <TableHead>ĐỊA CHỈ</TableHead>
              <TableHead>TRẠNG THÁI</TableHead>
              <TableHead>DOANH THU NGÀY</TableHead>
              <TableHead>NHÂN SỰ</TableHead>
              <TableHead className="text-right">HÀNH ĐỘNG</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <BranchRow key={branch.id} branch={branch} />
            ))}
          </TableBody>
        </Table>
      </div>

      <BranchTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
};
