import { useState } from 'react';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { TableRow, TableCell } from '@shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/constants/routes';
import type { BranchListItem } from '../../types/branch.types';
import { DeleteBranchDialog } from '../DeleteBranchDialog';
import { EditBranchDialog } from '../EditBranchDialog';
import { useBranchDetail } from '../../hooks/useBranchDetail';
import type { BranchDetailFull } from '../../data/branchDetailMock';

interface BranchRowProps {
  branch: BranchListItem;
}

/**
 * Row hiển thị thông tin một chi nhánh trong bảng
 * Click vào row sẽ navigate sang trang chi tiết chi nhánh
 */
export const BranchRow = ({ branch }: BranchRowProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { data: branchDetailData } = useBranchDetail(branch.id);
  const branchDetail = branchDetailData?.branch;

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

  const handleDelete = () => {
    setShowDeleteDialog(true);
    setOpen(false);
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
  };

  return (
    <>
      <TableRow
        className="border-b-gray-200 box cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleRowClick}
      >
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
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className="btn-ghost p-2 rounded-lg hover:bg-gray-100">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleViewDetail();
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleEdit();
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <DeleteBranchDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        branchId={branch.id}
        branchName={branch.name}
      />
      {showEditDialog && branchDetail && (
        <EditBranchDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          branch={branchDetail as BranchDetailFull}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};
    