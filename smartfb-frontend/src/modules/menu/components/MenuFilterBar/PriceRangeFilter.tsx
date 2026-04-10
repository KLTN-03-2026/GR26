import { Slider } from '@shared/components/ui/slider';
import { cn } from '@shared/utils/cn';
import { formatVND } from '@shared/utils/formatCurrency';

interface PriceRangeFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const PriceRangeFilter = ({
  value,
  onChange,
  min = 0,
  max = 200000,
  step = 5000,
  className,
}: PriceRangeFilterProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(val) => onChange(val as [number, number])}
        className="py-2"
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">{formatVND(value[0])}</span>
        <span className="text-gray-400">—</span>
        <span className="text-gray-600 font-medium">{formatVND(value[1])}</span>
      </div>
    </div>
  );
};
