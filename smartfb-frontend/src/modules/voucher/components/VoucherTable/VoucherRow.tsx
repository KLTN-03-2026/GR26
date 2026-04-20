/**
 * @author Đào Thu Thiên
 * @description Row hiển thị thông tin một voucher trong bảng
 * @created 2026-04-16
 */

import { useState } from 'react';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@shared/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import type { VoucherListItem, VoucherStatus } from '../../types/voucher.types';
import { EditVoucherDialog } from '../EditVoucherDialog';
import { DeleteVoucherDialog } from '../DeleteVoucherDialog';
import { useUpdateVoucherStatus } from '../../hooks/useUpdateVoucherStatus';

interface VoucherRowProps {
    voucher: VoucherListItem;
    onStatusChange?: () => void;
    onDelete?: () => void;
}

const getStatusBadgeClassName = (status: VoucherStatus) => {
    switch (status) {
        case 'ACTIVE':
            return 'badge-completed';
        case 'INACTIVE':
            return 'badge-warning';
        case 'EXPIRED':
            return 'badge-disabled';
        default:
            return 'badge-secondary';
    }
};

const getStatusLabel = (status: VoucherStatus) => {
    switch (status) {
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'INACTIVE':
            return 'Vô hiệu hóa';
        case 'EXPIRED':
            return 'Hết hạn';
        default:
            return status;
    }
};

export const VoucherRow = ({ voucher, onStatusChange, onDelete }: VoucherRowProps) => {
    const [open, setOpen] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { mutate: updateStatus, isPending: isUpdating } = useUpdateVoucherStatus();

    const handleEdit = () => {
        setShowEditDialog(true);
        setOpen(false);
    };

    const handleDelete = () => {
        setShowDeleteDialog(true);
        setOpen(false);
    };

    const handleToggleStatus = () => {
        const newStatus = voucher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        updateStatus(
            { id: voucher.id, payload: { status: newStatus } },
            {
                onSuccess: () => {
                    onStatusChange?.();
                },
            }
        );
        setOpen(false);
    };

    const isDisabled = voucher.status === 'EXPIRED';

    return (
        <>
            <TableRow className="box cursor-pointer border-b-gray-200 transition-colors hover:bg-gray-50">
                <TableCell className="font-mono text-sm font-medium text-gray-900">
                    {voucher.code}
                </TableCell>
                <TableCell className="font-medium text-gray-900 truncate">
                    {voucher.name}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                    {voucher.discountDisplay}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                    {voucher.periodDisplay}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                    {voucher.conditionDisplay}
                </TableCell>
                <TableCell>
                    <span className={`badge ${getStatusBadgeClassName(voucher.status)}`}>
                        {getStatusLabel(voucher.status)}
                    </span>
                </TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="btn-ghost rounded-lg p-2 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={handleEdit}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={handleToggleStatus}
                                disabled={isUpdating || isDisabled}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                {voucher.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={handleDelete}
                                className="text-red-600"
                                disabled={isDisabled}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>

            {showEditDialog && (
                <EditVoucherDialog
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                    voucher={voucher}
                    onSuccess={onStatusChange}
                />
            )}

            {showDeleteDialog && (
                <DeleteVoucherDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    voucherId={voucher.id}
                    voucherCode={voucher.code}
                    onSuccess={onDelete}
                />
            )}
        </>
    );
};