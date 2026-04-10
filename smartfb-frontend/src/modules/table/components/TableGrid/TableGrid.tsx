// Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
import type { TableDisplayItem } from '@modules/table/types/table.types';
import { TableCard } from './TableCard';
import { LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface TableGridProps {
  tables: TableDisplayItem[];
  onEdit: (table: TableDisplayItem) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onViewDetail: (id: string) => void;
  onAddTable?: () => void;
}

// Người sửa: Đào Thu Thiên - Ngày: 09/04/2026 - Thiết kế lại grid và empty state
export const TableGrid = ({
  tables,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetail,
  onAddTable
}: TableGridProps) => {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <LayoutGrid className="w-10 h-10 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">Không có bàn nào</p>
          <p className="text-sm text-gray-400 mt-1">Hãy thêm bàn mới để bắt đầu</p>
          {onAddTable && (
            <Button
              onClick={onAddTable}
              className="mt-6 gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              Thêm bàn đầu tiên
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Người sửa: Đào Thu Thiên - Ngày: 09/04/2026 - Thêm header với số lượng */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span className="text-sm text-gray-500">
            Hiển thị <span className="font-semibold text-gray-700">{tables.length}</span> bàn
          </span>
        </div>
      </div>

      {/* Grid layout - Responsive và đẹp */}
      <div className="grid gap-2.5 auto-rows-fr grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    </div>
  );
};
