import { type FC } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { formatVND } from '@shared/utils/formatCurrency';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Button } from '@shared/components/ui/button';
import { ProductStatusBadge } from './ProductStatusBadge';
import { GpToggle } from './GpToggle';
import type { MenuItem, MenuTag } from '@modules/menu/types/menu.types';
import { MENU_TAGS, MENU_CATEGORIES } from '@modules/menu/constants/menu.constants';

interface MenuCardProps {
  menu: MenuItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isAvailable: boolean) => void;
}

const tagStyles: Record<string, string> = {
  moi: 'bg-blue-100 text-blue-700',
  hot: 'bg-red-100 text-red-700',
  bestseller: 'bg-orange-100 text-orange-700',
  recommend: 'bg-green-100 text-green-700',
};

export const MenuCard: FC<MenuCardProps> = ({ menu, onEdit, onDelete, onToggle }) => {
  const category = MENU_CATEGORIES.find((c) => c.id === menu.category);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={menu.image}
          alt={menu.name}
          className="w-full h-full object-cover"
        />

        {/* Status Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <ProductStatusBadge status={menu.status} />
        </div>

        {/* Tags - Top Right */}
        {menu.tags && menu.tags.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {menu.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  tagStyles[tag] || 'bg-gray-100 text-gray-700'
                )}
              >
                {MENU_TAGS[tag]?.label || tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Menu - Top Right (below tags) */}
        <div className="absolute top-2 right-2 mt-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(menu.id)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(menu.id)} className="text-red-600">
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Category */}
        <span className="text-xs text-gray-500">{category?.name || menu.category}</span>

        {/* Product Name */}
        <h3 className="mt-1 text-lg font-semibold text-gray-900 line-clamp-2">
          {menu.name}
        </h3>

        {/* Price and GP Toggle */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">GIÁ BÁN</span>
            <span className="text-lg font-bold text-amber-600">{formatVND(menu.price)}</span>
          </div>
          <GpToggle
            gpPercent={menu.gpPercent}
            isAvailable={menu.isAvailable ?? true}
            onToggle={(isAvailable) => onToggle(menu.id, isAvailable)}
          />
        </div>
      </div>
    </div>
  );
};
