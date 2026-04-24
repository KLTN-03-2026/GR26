import { Users, MapPin, MoreVertical, Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import type { TableItem } from '../../types/table.types';
// import { TableStatusValues } from '../../types/table.types';

interface TableCardProps {
  table: TableItem;
  onEdit: (table: TableItem) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onViewDetail: (id: string) => void;
}

const getStatusConfig = (status: string, usageStatus: string) => {
  if (usageStatus === 'occupied') {
    return { label: 'Đang dùng', color: 'bg-red-100 text-red-700 border-red-200' };
  }
  if (usageStatus === 'reserved') {
    return { label: 'Đã đặt', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  }
  if (usageStatus === 'unpaid') {
    return { label: 'Chưa thanh toán', color: 'bg-orange-100 text-orange-700 border-orange-200' };
  }
  if (status === 'inactive') {
    return { label: 'Bảo trì', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  }
  return { label: 'Trống', color: 'bg-green-100 text-green-700 border-green-200' };
};

export const TableCard = ({ table, onEdit, onDelete, onToggleStatus, onViewDetail }: TableCardProps) => {
  const statusConfig = getStatusConfig(table.status, table.usageStatus);
  const isInactive = table.status === 'inactive';

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
        isInactive ? 'border-gray-200 opacity-60' : 'border-gray-100 hover:border-primary/30'
      }`}
      onClick={() => onViewDetail(table.id)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">{table.name}</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onViewDetail(table.id)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(table)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(table.id, table.status)} className="gap-2">
                  {isInactive ? (
                    <>
                      <Power className="h-4 w-4" />
                      Kích hoạt
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-4 w-4" />
                      Tạm ngưng
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(table.id, table.name)}
                  className="gap-2 text-red-600"
                  disabled={table.usageStatus === 'occupied' || table.usageStatus === 'unpaid'}
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa bàn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{table.areaName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Users className="w-3.5 h-3.5" />
          <span>Sức chứa: {table.capacity} người</span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          {table.usageStatus === 'occupied' && (
            <span className="text-xs text-gray-400">Đang phục vụ</span>
          )}
        </div>
      </div>
    </div>
  );
};