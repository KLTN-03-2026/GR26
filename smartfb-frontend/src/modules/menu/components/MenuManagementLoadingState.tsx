import { Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { MenuCardGrid } from './MenuCard/MenuCardGrid';
import { MenuCardSkeleton } from './MenuCard/MenuCardSkeleton';

const MENU_LOADING_SKELETON_KEYS = [
  'menu-loading-1',
  'menu-loading-2',
  'menu-loading-3',
  'menu-loading-4',
  'menu-loading-5',
  'menu-loading-6',
];

/**
 * Placeholder cho lúc trang thực đơn đang đồng bộ dữ liệu ban đầu.
 */
export const MenuManagementLoadingState = () => {
  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">Đang tải dữ liệu thực đơn</p>
          <p className="text-sm text-gray-500">
            Hệ thống đang đồng bộ món ăn và danh mục để hiển thị đúng bố cục.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" disabled>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
          <Button className="w-full bg-primary hover:bg-primary-hover sm:w-auto" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Thêm món mới
          </Button>
        </div>
      </div>

      <MenuCardGrid>
        {MENU_LOADING_SKELETON_KEYS.map((key) => (
          <MenuCardSkeleton key={key} />
        ))}
      </MenuCardGrid>
    </div>
  );
};
