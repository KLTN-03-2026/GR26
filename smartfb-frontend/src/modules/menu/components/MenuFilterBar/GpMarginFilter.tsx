import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { cn } from '@shared/utils/cn';
import type { GpMarginFilter } from '@modules/menu/types/menu.types';

interface GpMarginFilterProps {
  value: GpMarginFilter;
  onChange: (value: GpMarginFilter) => void;
  className?: string;
}

const GP_OPTIONS: { value: GpMarginFilter; label: string }[] = [
  { value: 'above-50', label: 'Trên 50%' },
  { value: 'below-50', label: 'Dưới 50%' },
  { value: 'all', label: 'Tất cả' },
];

export const GpMarginFilter = ({ value, onChange, className }: GpMarginFilterProps) => {
  return (
    <RadioGroup value={value} onValueChange={(val) => onChange(val as GpMarginFilter)} className={cn('space-y-3', className)}>
      {GP_OPTIONS.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem value={option.value} id={`gp-${option.value}`} />
          <label
            htmlFor={`gp-${option.value}`}
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            {option.label}
          </label>
        </div>
      ))}
    </RadioGroup>
  );
};
