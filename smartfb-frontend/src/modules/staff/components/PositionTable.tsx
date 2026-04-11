import { PencilLine, Trash2 } from 'lucide-react';
import type {
  StaffPosition,
  StaffPositionListItem,
} from '@modules/staff/types/position.types';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';

interface PositionTableProps {
  positions: StaffPositionListItem[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreatePosition: () => void;
  onEditPosition: (position: StaffPosition) => void;
  onTogglePosition: (position: StaffPosition) => void;
}

const formatCreatedAt = (value: string): string => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Không xác định';
  }

  return parsedDate.toLocaleDateString('vi-VN');
};

/**
 * Bảng danh sách chức vụ trong khu vực nhân sự.
 */
export const PositionTable = ({
  positions,
  hasActiveFilters,
  onClearFilters,
  onCreatePosition,
  onEditPosition,
  onTogglePosition,
}: PositionTableProps) => {
  if (positions.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-text-primary">
          {hasActiveFilters ? 'Không tìm thấy chức vụ phù hợp' : 'Chưa có chức vụ nào'}
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-text-secondary">
          {hasActiveFilters
            ? 'Hãy thử đổi từ khóa tìm kiếm hoặc xoá bộ lọc để xem lại toàn bộ danh sách chức vụ.'
            : 'Tạo trước các chức vụ như Thu ngân, Phục vụ, Quản lý chi nhánh để gán đúng cho nhân sự.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          {hasActiveFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              Xóa bộ lọc
            </Button>
          ) : null}
          <Button onClick={onCreatePosition}>Tạo chức vụ mới</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[220px]">Chức vụ</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className="w-[140px]">Nhân sự gán</TableHead>
            <TableHead className="w-[140px]">Ngày tạo</TableHead>
            <TableHead className="w-[220px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell>
                <div className="font-semibold text-text-primary">{position.name}</div>
              </TableCell>

              <TableCell>
                {position.description ? (
                  <p className="line-clamp-2 max-w-xl text-sm text-text-secondary">
                    {position.description}
                  </p>
                ) : (
                  <span className="text-sm italic text-gray-400">Chưa có mô tả</span>
                )}
              </TableCell>

              <TableCell>
                <span
                  className={
                    position.assignedStaffCount > 0
                      ? 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700'
                      : 'inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700'
                  }
                >
                  {position.assignedStaffCount > 0
                    ? `${position.assignedStaffCount} nhân sự`
                    : 'Chưa gán'}
                </span>
              </TableCell>

              <TableCell className="text-sm text-text-secondary">
                {formatCreatedAt(position.createdAt)}
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditPosition(position)}
                    className="gap-1.5"
                  >
                    <PencilLine className="h-4 w-4" />
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onTogglePosition(position)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Ngừng dùng
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
