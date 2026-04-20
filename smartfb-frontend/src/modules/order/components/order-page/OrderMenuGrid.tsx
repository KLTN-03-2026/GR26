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
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Không có món phù hợp</p>
          <p className="mt-2 text-sm text-slate-500">
            Thử đổi danh mục hoặc xóa bớt từ khóa để hiển thị nhiều món hơn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectItem(item.id)}
          className="group overflow-hidden rounded-[20px] border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
        >
          {/* Ảnh món — tỉ lệ 16/9 để compact hơn 4/3 */}
          <div className="aspect-video w-full overflow-hidden bg-slate-100">
            <img
              src={item.image || DEFAULT_MENU_IMAGE}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="p-3">
            {/* Tên món */}
            <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{item.name}</h3>

            {/* Danh mục — chỉ hiện khi có tên rõ ràng, không fallback sang ID */}
            {item.categoryName ? (
              <span className="mt-1.5 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600 line-clamp-1">
                {item.categoryName}
              </span>
            ) : null}

            {/* Giá + nút thêm */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-sm font-black text-orange-500">{formatVND(item.price)}</span>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-colors group-hover:bg-orange-500">
                <Plus className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
