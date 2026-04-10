import { cn } from '@shared/utils/cn';

interface CategoryOption {
  id: string;
  name: string;
}

interface OrderCategoryTabsProps {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const OrderCategoryTabs = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: OrderCategoryTabsProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={cn(
          'rounded-full border px-5 py-2.5 text-sm font-bold transition-colors',
          selectedCategory === 'all'
            ? 'border-orange-500 bg-orange-500 text-white'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
        )}
      >
        Tất cả
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            'rounded-full border px-5 py-2.5 text-sm font-bold transition-colors',
            selectedCategory === category.id
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};
