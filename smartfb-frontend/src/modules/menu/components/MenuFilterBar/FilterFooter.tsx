import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';

interface FilterFooterProps {
  activeFilterCount: number;
  onReset: () => void;
  onApply: () => void;
  className?: string;
}

export const FilterFooter = ({
  activeFilterCount,
  onReset,
  onApply,
  className,
}: FilterFooterProps) => {
  return (
    <div className={cn('pt-4 mt-4 border-t border-gray-100', className)}>
      {/* Active filters count */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          {activeFilterCount} bộ lọc đang áp dụng
        </span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-medium">
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={activeFilterCount === 0}
          className="flex-1"
        >
          Đặt lại
        </Button>
        <Button
          variant="default"
          onClick={onApply}
          disabled={activeFilterCount === 0}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          Áp dụng lọc
        </Button>
      </div>
    </div>
  );
};
