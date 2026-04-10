import { Checkbox } from '@shared/components/ui/checkbox';
import { cn } from '@shared/utils/cn';
import type { MenuCategory, MenuCategoryInfo } from '@modules/menu/types/menu.types';

interface CategoryFilterProps {
  categories: MenuCategoryInfo[];
  selectedCategories: MenuCategory[];
  onCategoryChange: (category: MenuCategory) => void;
  className?: string;
}

export const CategoryFilter = ({
  categories,
  selectedCategories,
  onCategoryChange,
  className,
}: CategoryFilterProps) => {
  if (categories.length === 0) {
    return <p className={cn('text-sm text-gray-500', className)}>Chưa có danh mục để lọc.</p>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {categories.map((category) => (
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
