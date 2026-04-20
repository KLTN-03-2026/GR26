import type { ReactNode } from 'react';
import { Search, UtensilsCrossed, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';

interface OrderPageToolbarProps {
  cartActions: ReactNode;
  searchKeyword: string;
  /** Tên bàn hiện tại — hiển thị giữa ô tìm kiếm và nút giỏ hàng */
  tableName: string;
  onSearchKeywordChange: (value: string) => void;
  onClearSearch: () => void;
}

export const OrderPageToolbar = ({
  cartActions,
  searchKeyword,
  tableName,
  onSearchKeywordChange,
  onClearSearch,
}: OrderPageToolbarProps) => {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#fff8f1_0%,#ffffff_48%)] p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-3">
        {/* Ô tìm kiếm món */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm kiếm món ăn, đồ uống..."
            className="h-14 rounded-full border-slate-200 bg-white pl-12 pr-14 text-sm focus-visible:ring-orange-500"
            value={searchKeyword}
            onChange={(event) => onSearchKeywordChange(event.target.value)}
          />
          {searchKeyword ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClearSearch}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {/* Tên bàn — giữa search và nút giỏ hàng */}
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
          <UtensilsCrossed className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{tableName}</span>
        </div>

        {/* Nút hiện/ẩn giỏ hàng */}
        {cartActions}
      </div>
    </div>
  );
};
