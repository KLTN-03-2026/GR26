import { useState } from 'react';
import { MoreHorizontal, Eye, Pencil } from 'lucide-react';
import { TableCell, TableRow } from '@shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import type { BranchListItem } from '@modules/branch/types/branch.types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/constants/routes';
import { EditBranchDialog } from '../EditBranchDialog';

interface BranchRowProps {
  branch: BranchListItem;
}

const formatCreatedAt = (createdAt: string) =>
  new Date(createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const getStatusBadgeClassName = (status: BranchListItem['status']) =>
  status === 'ACTIVE' ? 'badge-completed' : 'badge-warning';

const getStatusLabel = (status: BranchListItem['status']) =>
  status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';

/**
 * Row hiển thị thông tin một chi nhánh trong bảng.
 * Chỉ expose các action mà backend hiện có hỗ trợ.
 */
export const BranchRow = ({ branch }: BranchRowProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleRowClick = () => {
    navigate(`${ROUTES.OWNER.BRANCHES}/${branch.id}`);
  };

  const handleViewDetail = () => {
    navigate(`${ROUTES.OWNER.BRANCHES}/${branch.id}`);
    setOpen(false);
  };

  const handleEdit = () => {
    setShowEditDialog(true);
    setOpen(false);
  };

  return (
    <>
      <TableRow
        className="box cursor-pointer border-b-gray-200 transition-colors hover:bg-gray-50"
        onClick={handleRowClick}
      >
        <TableCell className="font-medium text-gray-900 truncate">
          {branch.name}
        </TableCell>
        <TableCell className="font-mono text-sm text-gray-600">
          {branch.code}
        </TableCell>
        <TableCell className="truncate text-sm text-gray-600">
          {branch.address || 'Chưa cập nhật'}
        </TableCell>
        <TableCell className="text-sm text-gray-600">
          {branch.phone || 'Chưa cập nhật'}
        </TableCell>
        <TableCell>
          <span className={`badge ${getStatusBadgeClassName(branch.status)}`}>
            {getStatusLabel(branch.status)}
          </span>
        </TableCell>
        <TableCell className="font-medium text-gray-900">
          {formatCreatedAt(branch.createdAt)}
        </TableCell>
        <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className="btn-ghost rounded-lg p-2 hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(event) => event.preventDefault()}>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleViewDetail();
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleEdit();
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {showEditDialog && (
        <EditBranchDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          branch={branch}
        />
      )}
    </>
  );
};
