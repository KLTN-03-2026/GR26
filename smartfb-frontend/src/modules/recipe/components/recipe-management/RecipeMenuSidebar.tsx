import { Search } from 'lucide-react';

import type {
  RecipeMenuCategory,
  RecipeMenuItem,
} from '@modules/recipe/types/recipe.types';
import { formatRecipeNumber } from '@modules/recipe/utils';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { cn } from '@shared/utils/cn';

interface RecipeMenuSidebarProps {
  searchKeyword: string;
  debouncedSearchKeyword: string;
  selectedCategoryId: string;
  selectedItemId: string;
  categoryOptions: RecipeMenuCategory[];
  menuItems: RecipeMenuItem[];
  hasMoreMenuItems: boolean;
  isCategoriesError: boolean;
  isLoadingMoreMenuItems: boolean;
  onSearchKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSelectItemId: (itemId: string) => void;
  onLoadMoreMenuItems: () => void;
}

export const RecipeMenuSidebar = ({
  searchKeyword,
  debouncedSearchKeyword,
  selectedCategoryId,
  selectedItemId,
  categoryOptions,
  menuItems,
  hasMoreMenuItems,
  isCategoriesError,
  isLoadingMoreMenuItems,
  onSearchKeywordChange,
  onCategoryChange,
  onSelectItemId,
  onLoadMoreMenuItems,
}: RecipeMenuSidebarProps) => {
  return (
    <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900">Danh sách món</h2>

      <div className="grid gap-3">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="recipe-search"
          >
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="recipe-search"
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
              className="pl-9"
              placeholder="Ví dụ: Bạc xỉu, Trà đào..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Danh mục</p>
          <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCategoriesError ? (
            <p className="text-xs text-amber-700">
              Không tải được danh mục. Hệ thống đang giữ bộ lọc mặc định.
            </p>
          ) : null}
        </div>
      </div>

      {debouncedSearchKeyword ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="mt-1 text-xs text-slate-500">
            Từ khóa: {debouncedSearchKeyword}
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[minmax(0,1fr)_88px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <span>Tên món</span>
          <span className="text-right">Giá bán</span>
        </div>

        <div className="max-h-[38rem] overflow-y-auto">
          {menuItems.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">
              <p>Chưa có món phù hợp trong phần dữ liệu đã tải.</p>
              {hasMoreMenuItems ? (
                <p className="mt-1">
                  Bạn có thể bấm tải thêm để tìm tiếp theo danh mục đang chọn.
                </p>
              ) : null}
            </div>
          ) : (
            menuItems.map((item) => {
              const isSelected = item.id === selectedItemId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItemId(item.id)}
                  className={cn(
                    'grid w-full grid-cols-[minmax(0,1fr)_88px] items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0',
                    isSelected ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'
                  )}
                >
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-right text-xs font-medium text-slate-600">
                    {formatRecipeNumber(item.basePrice)} đ
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onLoadMoreMenuItems}
        disabled={!hasMoreMenuItems || isLoadingMoreMenuItems}
        className="w-full"
      >
        {isLoadingMoreMenuItems
          ? 'Đang tải thêm món...'
          : hasMoreMenuItems
            ? 'Tải thêm 10 món'
            : 'Đã tải hết món'}
      </Button>
    </aside>
  );
};
