import { Plus } from 'lucide-react';
import type { MenuItem } from '@modules/menu/types/menu.types';
import { formatVND } from '@shared/utils/formatCurrency';
import { DEFAULT_MENU_IMAGE } from './orderPage.utils';

interface OrderMenuGridProps {
  items: MenuItem[];
  onSelectItem: (menuItemId: string) => void;
}

export const OrderMenuGrid = ({ items, onSelectItem }: OrderMenuGridProps) => {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Không có món phù hợp</p>
          <p className="mt-2 text-sm text-slate-500">Thử đổi danh mục hoặc từ khóa tìm kiếm.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectItem(item.id)}
          className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
        >
          <div className="h-48 w-full overflow-hidden bg-slate-100">
            <img
              src={item.image || DEFAULT_MENU_IMAGE}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-4 p-5">
            <div>
              <h3 className="line-clamp-1 text-xl font-black text-slate-900">{item.name}</h3>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">
                {item.description || 'Món đang được phục vụ tại chi nhánh hiện tại.'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-orange-500">{formatVND(item.price)}</span>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition-colors">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
