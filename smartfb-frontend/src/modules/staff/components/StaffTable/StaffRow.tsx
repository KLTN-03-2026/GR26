import { useState } from 'react';
import { MoreHorizontal, Eye, Pencil, Trash2, Lock, Unlock } from 'lucide-react';
import { TableRow, TableCell } from '@shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/constants/routes';
import type { StaffListItem } from '../../types/staff.types';
import { DeleteStaffDialog } from '../DeleteStaffDialog';
import { EditStaffDialog } from '../EditStaffDialog';
import { ToggleStaffStatusDialog } from '../ToggleStaffStatusDialog';
import { useStaffDetail } from '../../hooks/useStaffDetail';
import type { StaffDetailFull } from '../../data/staffDetailMock';

interface StaffRowProps {
  staff: StaffListItem;
}

/**
 * Row hiển thị thông tin một nhân viên trong bảng
 * Đã cập nhật theo Module 4 Spec (fullName, positionName)
 */
export const StaffRow = ({ staff }: StaffRowProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  
  const { data: staffDetailData } = useStaffDetail(staff.id);
  const staffDetail = staffDetailData?.staff;

  const handleRowClick = () => {
    navigate(`${ROUTES.OWNER.STAFF}/${staff.id}`);
  };

  const handleViewDetail = () => {
    navigate(`${ROUTES.OWNER.STAFF}/${staff.id}`);
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

  const handleToggleStatus = () => {
    setShowToggleDialog(true);
    setOpen(false);
  };

  return (
    <>
      <TableRow
        className="border-b-gray-200 box cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleRowClick}
      >
        <TableCell className="font-medium text-gray-900 truncate">
          {staff.fullName}
        </TableCell>
        <TableCell className="text-gray-600 text-sm truncate">
          {staff.email}
        </TableCell>
        <TableCell className="text-gray-600 text-sm">
          {staff.phone}
        </TableCell>
        <TableCell className="text-sm">
          <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
            {staff.positionName}
          </span>
        </TableCell>
        <TableCell className="text-sm">
          {staff.branchName}
        </TableCell>
        <TableCell>
          <span className={`badge ${staff.status === 'active' ? 'badge-completed' : 'badge-warning'}`}>
            {staff.status === 'active' ? 'Đang làm' : 'Đã nghỉ'}
          </span>
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className="btn-ghost p-2 rounded-lg hover:bg-gray-100">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleViewDetail}>
                <Eye className="w-4 h-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={handleToggleStatus}
                className={staff.status === 'active' ? 'text-orange-600' : 'text-green-600'}
              >
                {staff.status === 'active' ? (
                  <Lock className="w-4 h-4 mr-2" />
                ) : (
                  <Unlock className="w-4 h-4 mr-2" />
                )}
                {staff.status === 'active' ? 'Khóa' : 'Mở khóa'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <DeleteStaffDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        staffId={staff.id}
        staffName={staff.fullName}
      />
      {showEditDialog && staffDetail && (
        <EditStaffDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          staff={staffDetail as StaffDetailFull}
          onSuccess={() => setShowEditDialog(false)}
        />
      )}
      <ToggleStaffStatusDialog
        open={showToggleDialog}
        onOpenChange={setShowToggleDialog}
        staffId={staff.id}
        staffName={staff.fullName}
        currentStatus={staff.status}
        onSuccess={() => setShowToggleDialog(false)}
      />
    </>
  );
};