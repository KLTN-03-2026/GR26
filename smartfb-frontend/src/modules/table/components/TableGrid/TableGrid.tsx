import { TableCard } from './TableCard';
import type { TableItem } from '../../types/table.types';

interface TableGridProps {
  tables: TableItem[];
  onEdit: (table: TableItem) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onViewDetail: (id: string) => void;
}

export const TableGrid = ({ tables, onEdit, onDelete, onToggleStatus, onViewDetail }: TableGridProps) => {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Không có bàn nào</p>
          <p className="text-sm text-gray-400 mt-1">Hãy thêm bàn mới để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
  );
};