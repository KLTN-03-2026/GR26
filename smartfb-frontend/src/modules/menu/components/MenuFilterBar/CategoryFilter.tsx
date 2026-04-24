import { Checkbox } from '@shared/components/ui/checkbox';
import { cn } from '@shared/utils/cn';
import type { MenuCategory } from '@modules/menu/types/menu.types';
import { MENU_CATEGORIES } from '@modules/menu/constants/menu.constants';

interface CategoryFilterProps {
  selectedCategories: MenuCategory[];
  onCategoryChange: (category: MenuCategory) => void;
  className?: string;
}

export const CategoryFilter = ({
  selectedCategories,
  onCategoryChange,
  className,
}: CategoryFilterProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {MENU_CATEGORIES.map((category) => (
        <div key={category.id} className="flex items-center space-x-2">
          <Checkbox
            id={`category-${category.id}`}
            checked={selectedCategories.includes(category.id)}
            onCheckedChange={() => onCategoryChange(category.id)}
          />
          <label
            htmlFor={`category-${category.id}`}
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            {category.name}
          </label>
          {category.count !== undefined && (
            <span className="text-xs text-gray-400 ml-auto">{category.count}</span>
          )}
        </div>
      ))}
    </div>
  );
};
