import { useState } from 'react';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@shared/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import type { LocalTime, ShiftTemplate } from '@modules/shift/types/shift.types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/constants/routes';

interface ShiftTemplateRowProps {
    template: ShiftTemplate;
    onDelete: (id: string) => void;
    onEdit: (template: ShiftTemplate) => void;
}

const formatTime = (time?: LocalTime | null): string => {
    if (typeof time?.hour !== 'number' || typeof time?.minute !== 'number') {
        return '--:--';
    }

    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
};

const getStatusBadgeClassName = (active: boolean) =>
    active ? 'badge-completed' : 'badge-warning';

const getStatusLabel = (active: boolean) =>
    active ? 'Hoạt động' : 'Ngưng hoạt động';

/**
 * Row hiển thị thông tin một ca mẫu trong bảng.
 */
export const ShiftTemplateRow = ({ template, onDelete, onEdit }: ShiftTemplateRowProps) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleViewDetail = () => {
        navigate(`${ROUTES.OWNER.SCHEDULES}/${template.id}`);
        setOpen(false);
    };

    const handleEdit = () => {
        onEdit(template);
        setOpen(false);
    };

    const handleDelete = () => {
        onDelete(template.id);
        setOpen(false);
    };

    return (
        <TableRow className="box cursor-pointer border-b-gray-200 transition-colors hover:bg-gray-50">
            <TableCell className="font-medium text-gray-900 truncate">
                {template.name}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
                {formatTime(template.startTime)}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
                {formatTime(template.endTime)}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
                {template.minStaff} - {template.maxStaff}
            </TableCell>
            <TableCell>
                <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: template.color }}
                />
            </TableCell>
            <TableCell>
                <span className={`badge ${getStatusBadgeClassName(template.active)}`}>
                    {getStatusLabel(template.active)}
                </span>
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
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                handleDelete();
                            }}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};
