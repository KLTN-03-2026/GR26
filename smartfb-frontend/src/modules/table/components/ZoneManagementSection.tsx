import { Edit3, Layers3, MapPinned, Plus, Trash2 } from 'lucide-react';
import type { TableArea } from '@modules/table/types/table.types';
import { Button } from '@shared/components/ui/button';

interface ZoneWithStats extends TableArea {
  tableCount: number;
}

interface ZoneManagementSectionProps {
  zones: ZoneWithStats[];
  onCreateZone: () => void;
  onEditZone: (zone: TableArea) => void;
  onDeleteZone: (zone: ZoneWithStats) => void;
}

/**
 * Hiển thị danh sách khu vực để thao tác CRUD ngay trong trang quản lý bàn.
 */
export const ZoneManagementSection = ({
  zones,
  onCreateZone,
  onEditZone,
  onDeleteZone,
}: ZoneManagementSectionProps) => {
  return (
    <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">Quản lý khu vực</h2>
          </div>
          <p className="text-sm text-gray-500">
            Danh sách khu vực đang có trong chi nhánh và số bàn tương ứng.
          </p>
        </div>

        <Button onClick={onCreateZone} className="h-9 gap-2 rounded-xl shadow-sm">
          <Plus className="h-4 w-4" />
          Tạo khu vực
        </Button>
      </div>

      {zones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Layers3 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-gray-700">Chi nhánh chưa có khu vực nào</p>
          <p className="mt-1 text-sm text-gray-500">
            Hãy tạo khu vực trước để nhóm bàn theo tầng hoặc không gian phục vụ.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 transition-colors hover:border-gray-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold text-gray-900">{zone.name}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-white px-2.5 py-1">
                    Tầng {zone.floorNumber}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                    {zone.tableCount} bàn
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <p className="text-xs text-gray-500 sm:max-w-[220px] sm:text-right">
                  {zone.tableCount === 0 ? 'Đang trống' : `${zone.tableCount} bàn đang được gán`}
                </p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => onEditZone(zone)}
                  >
                    <Edit3 className="h-4 w-4 text-amber-600" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => onDeleteZone(zone)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
