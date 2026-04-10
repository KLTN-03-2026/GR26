import {
  Building2,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Power,
  PowerOff,
  Circle,
  Square,
  Users,
} from 'lucide-react';
import type { TableDisplayItem } from '@modules/table/types/table.types';
import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';

interface TableCardProps {
  table: TableDisplayItem;
  onSelectTable: (table: TableDisplayItem) => void;
  onEdit: (table: TableDisplayItem) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onViewDetail: (id: string) => void;
}

/**
 * Màu bàn ưu tiên nhận biết nhanh:
 * bàn trống dùng xanh dương nhạt, bàn không trống dùng vàng, bàn bảo trì dùng xám.
 */
const getStatusConfig = (status: string, usageStatus: string) => {
  if (status === 'inactive') {
    return {
      dotColor: 'bg-gray-400',
      surfaceClass: 'border-gray-200 bg-gray-100/80',
      hoverClass: 'hover:border-gray-300 hover:shadow-gray-200/60',
    };
  }

  if (usageStatus === 'available') {
    return {
      dotColor: 'bg-sky-500',
      surfaceClass: 'border-sky-100 bg-sky-50/90',
      hoverClass: 'hover:border-sky-200 hover:shadow-sky-100',
    };
  }

  if (usageStatus === 'unpaid') {
    return {
      dotColor: 'bg-amber-500',
      surfaceClass: 'border-amber-100 bg-amber-50/90',
      hoverClass: 'hover:border-amber-200 hover:shadow-amber-100',
    };
  }

  if (usageStatus === 'reserved') {
    return {
      dotColor: 'bg-amber-500',
      surfaceClass: 'border-amber-100 bg-amber-50/90',
      hoverClass: 'hover:border-amber-200 hover:shadow-amber-100',
    };
  }

  return {
    dotColor: 'bg-amber-500',
    surfaceClass: 'border-amber-100 bg-amber-50/90',
    hoverClass: 'hover:border-amber-200 hover:shadow-amber-100',
  };
};

const ShapeMarker = ({ shape }: { shape: string }) =>
  shape === 'square' ? (
    <Square className="h-3.5 w-3.5 text-gray-400" />
  ) : (
    <Circle className="h-3.5 w-3.5 text-gray-400" />
  );

export const TableCard = ({
  table,
  onSelectTable,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetail,
}: TableCardProps) => {
  const statusConfig = getStatusConfig(table.status, table.usageStatus);
  const isInactive = table.status === 'inactive';
  const canDelete = table.usageStatus !== 'occupied' && table.usageStatus !== 'unpaid';

  const handleCardClick = () => {
    // Bàn tạm ngưng không cho vào luồng order, giữ hành vi xem chi tiết để người dùng kiểm tra trạng thái.
    if (isInactive) {
      onViewDetail(table.id);
      return;
    }

    onSelectTable(table);
  };

  return (
    <div
      className={`group relative min-h-[136px] cursor-pointer overflow-hidden rounded-[20px] border-2 bg-white transition-all duration-300
        ${statusConfig.surfaceClass}
        ${isInactive ? 'opacity-70' : `hover:-translate-y-1 ${statusConfig.hoverClass} hover:shadow-md`}
      `}
      onClick={handleCardClick}
    >
      <div className="p-3">
        <div className="mb-2.5 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
            <div className={`h-3.5 w-3.5 rounded-full ${statusConfig.dotColor}`} />
            {/* <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              {table.status === 'inactive' ? 'Ngưng' : 'Hoạt động'}
            </span> */}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
              <Users className="h-3 w-3 text-gray-400" />
              {table.capacity} chỗ
            </span>
            <div onClick={(event) => event.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-black/5"
                  >
                    <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border-gray-100 shadow-lg">
                  <DropdownMenuItem onClick={() => onViewDetail(table.id)} className="cursor-pointer gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(table)} className="cursor-pointer gap-2">
                    <Edit className="h-4 w-4 text-amber-500" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleStatus(table.id, table.status)} className="cursor-pointer gap-2">
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
                    className="cursor-pointer gap-2 text-red-600"
                    disabled={!canDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa bàn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="truncate text-lg font-black leading-none tracking-tight text-gray-900">
            {table.name}
          </h3>

          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{table.zoneName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{table.branchName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShapeMarker shape={table.shape} />
              <span>{table.shape === 'square' ? 'Vuông' : 'Tròn'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
