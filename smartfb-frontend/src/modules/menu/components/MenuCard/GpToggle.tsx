import { Switch } from '@shared/components/ui/switch';
import { cn } from '@shared/utils/cn';

interface GpToggleProps {
  isAvailable: boolean;
  onToggle: (isAvailable: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const GpToggle = ({ isAvailable, onToggle, className, disabled = false }: GpToggleProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Switch checked={isAvailable} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  );
};
