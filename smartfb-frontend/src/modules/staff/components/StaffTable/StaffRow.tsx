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
import type { StaffSummary } from '../../types/staff.types';
import { DeleteStaffDialog } from '../DeleteStaffDialog';
import { EditStaffDialog } from '../EditStaffDialog';
import { useStaffDetail } from '../../hooks/useStaffDetail';

interface StaffRowProps {
  staff: StaffSummary;
  onRefresh?: () => void;
}

export const StaffRow = ({ staff, onRefresh }: StaffRowProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { data: staffDetail } = useStaffDetail(staff.id);

  const handleRowClick = () => {
    navigate(ROUTES.OWNER.STAFF_DETAIL.replace(':id', staff.id));
  };

  const handleViewDetail = () => {
    navigate(ROUTES.OWNER.STAFF_DETAIL.replace(':id', staff.id));
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { text: 'Đang làm', className: 'badge-completed' };
      case 'INACTIVE': return { text: 'Đã nghỉ', className: 'badge-warning' };
      default: return { text: status, className: 'badge-secondary' };
    }
  };

  const statusInfo = getStatusDisplay(staff.status);

  return (
    <>
      <TableRow
        className="border-b-gray-200 box cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleRowClick}
      >
        <TableCell className="font-medium text-gray-900 truncate">
          {staff.fullName}
        </TableCell>
        {/* <TableCell className="text-gray-600 text-sm">
          {staff.employeeCode || '---'}
        </TableCell> */}
        <TableCell className="text-gray-600 text-sm">
          {staff.phone}
        </TableCell>
        <TableCell className="text-gray-600 text-sm truncate">
          {staff.email || '---'}
        </TableCell>
        <TableCell className="text-sm">
          <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
            {staff.positionName || 'Chưa phân công'}
          </span>
        </TableCell>
        <TableCell>
          <span className={`badge ${statusInfo.className}`}>
            {statusInfo.text}
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
        onSuccess={() => {
          setShowDeleteDialog(false);
          onRefresh?.();
        }}
      />

      {showEditDialog && staffDetail && (
        <EditStaffDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          staff={staffDetail}
          onSuccess={() => {
            setShowEditDialog(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};