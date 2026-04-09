import { X, Users, MapPin, Building2, Calendar, Clock, Edit, Power, PowerOff } from 'lucide-react';
import type { TableItem } from '@modules/table/types/table.types';
import { Button } from '@shared/components/ui/button';

interface TableDetailDrawerProps {
  table: TableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (table: TableItem) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

const getStatusBadge = (status: string, usageStatus: string) => {
  if (usageStatus === 'occupied') {
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Đang phục vụ</span>;
  }
  if (usageStatus === 'reserved') {
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">Đã đặt trước</span>;
  }
  if (usageStatus === 'unpaid') {
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">Chưa thanh toán</span>;
  }
  if (status === 'inactive') {
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Bảo trì</span>;
  }
  return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Trống</span>;
};

export const TableDetailDrawer = ({ table, isOpen, onClose, onEdit, onToggleStatus }: TableDetailDrawerProps) => {
  if (!table) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Chi tiết bàn</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{table.name}</h3>
            {getStatusBadge(table.status, table.usageStatus)}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Khu vực</p>
                {/* SỬA: areaName -> zoneName */}
                <p className="font-medium">{table.zoneName || 'Chưa có khu vực'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Sức chứa</p>
                <p className="font-medium">{table.capacity} người</p>
              </div>
            </div>

            {/* SỬA: Thêm hiển thị shape */}
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-5 h-5 text-gray-400">
                {table.shape === 'square' ? '⬛' : '⚪'}
              </div>
              <div>
                <p className="text-xs text-gray-400">Hình dạng</p>
                <p className="font-medium">{table.shape === 'square' ? 'Bàn vuông' : 'Bàn tròn'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Chi nhánh</p>
                <p className="font-medium">{table.branchName || 'Đang tải...'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Ngày tạo</p>
                <p className="font-medium">{new Date(table.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Cập nhật lần cuối</p>
                <p className="font-medium">{new Date(table.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </div>

          {table.description && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-400 mb-1">Mô tả</p>
              <p className="text-sm text-gray-600">{table.description}</p>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => onEdit(table)}
            >
              <Edit className="w-4 h-4" />
              Chỉnh sửa thông tin
            </Button>
            <Button
              variant={table.status === 'active' ? 'destructive' : 'default'}
              className="w-full justify-center gap-2"
              onClick={() => onToggleStatus(table.id, table.status)}
            >
              {table.status === 'active' ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  Tạm ngưng hoạt động
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  Kích hoạt lại
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};