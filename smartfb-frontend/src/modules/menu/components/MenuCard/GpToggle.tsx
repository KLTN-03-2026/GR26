import { Switch } from '@shared/components/ui/switch';
import { cn } from '@shared/utils/cn';

interface GpToggleProps {
  gpPercent: number;
  isAvailable: boolean;
  onToggle: (isAvailable: boolean) => void;
  className?: string;
}

export const GpToggle = ({ gpPercent, isAvailable, onToggle, className }: GpToggleProps) => {
  const gpColor = gpPercent >= 50 ? 'text-green-600' : 'text-orange-600';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">GP%</span>
        <span className={cn('text-sm font-semibold', gpColor)}>{gpPercent}%</span>
      </div>
      <Switch checked={isAvailable} onCheckedChange={onToggle} />
    </div>
  );
};
