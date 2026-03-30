import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { cn } from '@shared/utils/cn';
import type { MenuSortOption } from '@modules/menu/types/menu.types';
import { MENU_SORT_OPTIONS } from '@modules/menu/constants/menu.constants';

interface SortFilterProps {
  value: MenuSortOption;
  onChange: (value: MenuSortOption) => void;
  className?: string;
}

export const SortFilter = ({ value, onChange, className }: SortFilterProps) => {
  const options = Object.entries(MENU_SORT_OPTIONS).map(([value, { label }]) => ({
    value: value as MenuSortOption,
    label,
  }));

  return (
    <RadioGroup value={value} onValueChange={(val) => onChange(val as MenuSortOption)} className={cn('space-y-3', className)}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
          <label
            htmlFor={`sort-${option.value}`}
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            {option.label}
          </label>
        </div>
      ))}
    </RadioGroup>
  );
};
