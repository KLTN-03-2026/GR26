import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import type { StaffListItem } from '@modules/staff/types/staff.types';
import { StaffRow } from './StaffRow';
import { StaffTablePagination } from './StaffTablePagination';

interface StaffTableProps {
  staff: StaffListItem[];
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Table hiển thị danh sách nhân viên dùng shadcn/ui
 * Đáp ứng PB08: Hiển thị tên, email, số điện thoại, vai trò, chi nhánh, trạng thái
 */
export const StaffTable = ({
  staff,
  currentPage,
  totalPages,
  totalItems = 0,
  onPageChange,
  isLoading = false,
}: StaffTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy nhân viên nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader className="border-0">
            <TableRow className="hover:bg-cream border-b-0">
              <TableHead>HỌ TÊN</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>SỐ ĐIỆN THOẠI</TableHead>
              <TableHead>VỊ TRÍ</TableHead>
              <TableHead>CHI NHÁNH</TableHead>
              <TableHead>TRẠNG THÁI</TableHead>
              <TableHead className="text-right">HÀNH ĐỘNG</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <StaffRow key={member.id} staff={member} />
            ))}
          </TableBody>
        </Table>
      </div>
      <StaffTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
};
