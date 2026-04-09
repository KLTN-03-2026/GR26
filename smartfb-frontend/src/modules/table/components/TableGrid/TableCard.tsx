import { Users, MapPin, MoreVertical, Edit, Trash2, Eye, Power, PowerOff, Circle, Square } from 'lucide-react';
import type { TableItem } from '@modules/table/types/table.types';
import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';

interface TableCardProps {
  table: TableItem;
  onEdit: (table: TableItem) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onViewDetail: (id: string) => void;
}

// Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
const getStatusConfig = (status: string, usageStatus: string) => {
  if (usageStatus === 'occupied') {
    return {
      label: 'Đang phục vụ',
      color: 'bg-red-50 text-red-700 border-red-200',
      dotColor: 'bg-red-500',
      ringColor: 'ring-red-500/20'
    };
  }
  if (usageStatus === 'reserved') {
    return {
      label: 'Đã đặt trước',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      ringColor: 'ring-amber-500/20'
    };
  }
  if (usageStatus === 'unpaid') {
    return {
      label: 'Chưa thanh toán',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      dotColor: 'bg-orange-500',
      ringColor: 'ring-orange-500/20'
    };
  }
  if (status === 'inactive') {
    return {
      label: 'Bảo trì',
      color: 'bg-gray-100 text-gray-500 border-gray-200',
      dotColor: 'bg-gray-400',
      ringColor: 'ring-gray-400/20'
    };
  }
  return {
    label: 'Trống',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500/20'
  };
};

// Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
const TableShapeIcon = ({ shape }: { shape: string }) => {
  if (shape === 'square') {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-inner">
        <Square className="w-4 h-4 text-blue-600" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center shadow-inner">
      <Circle className="w-4 h-4 text-purple-600" />
    </div>
  );
};

export const TableCard = ({ table, onEdit, onDelete, onToggleStatus, onViewDetail }: TableCardProps) => {
  const statusConfig = getStatusConfig(table.status, table.usageStatus);
  const isInactive = table.status === 'inactive';
  const canDelete = table.usageStatus !== 'occupied' && table.usageStatus !== 'unpaid';

  return (
    <div
      className={`group relative bg-white rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden
        ${isInactive ? 'opacity-60 grayscale-[0.1]' : 'hover:shadow-xl hover:-translate-y-1.5 hover:shadow-primary/5'}
        border border-gray-100 hover:border-primary/20
      `}
      onClick={() => onViewDetail(table.id)}
    >
      {/* Người sửa: Đào Thu Thiên - Ngày: 09/04/2026 - Thêm gradient overlay khi hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Người sửa: Đào Thu Thiên - Ngày: 09/04/2026 - Thêm status bar phía trên */}
      <div className={`h-1.5 ${statusConfig.color.replace('bg-', 'bg-').replace('text-', '').replace('border-', '')}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <TableShapeIcon shape={table.shape} />
            <div>
              <h3 className="text-lg font-bold text-gray-800 leading-tight">{table.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} animate-pulse`} />
                <span className="text-xs text-gray-400">ID: {table.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100">
                <DropdownMenuItem onClick={() => onViewDetail(table.id)} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(table)} className="gap-2 cursor-pointer">
                  <Edit className="h-4 w-4 text-amber-500" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(table.id, table.status)} className="gap-2 cursor-pointer">
                  {isInactive ? (
                    <>
                      <Power className="h-4 w-4 text-green-500" />
                      Kích hoạt
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-4 w-4 text-red-500" />
                      Tạm ngưng
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(table.id, table.name)}
                  className="gap-2 text-red-600 cursor-pointer"
                  disabled={!canDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa bàn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Thông tin chi tiết - Người sửa: Đào Thu Thiên - Ngày: 09/04/2026 */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-gray-600 flex-1">{table.zoneName || 'Chưa có khu vực'}</span>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-gray-600 flex-1">Sức chứa: {table.capacity} người</span>
          </div>
        </div>

        {/* Footer - Người sửa: Đào Thu Thiên - Ngày: 09/04/2026 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${statusConfig.color} flex items-center gap-1.5`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
            {statusConfig.label}
          </div>
          {table.usageStatus === 'occupied' && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              Đang phục vụ
            </span>
          )}
        </div>
      </div>
    </div>
  );
};