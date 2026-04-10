import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { Button } from '@shared/components/ui/button';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const FilterSection = ({
  title,
  children,
  defaultOpen = true,
  className,
}: FilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border-b border-gray-100 pb-4 last:border-b-0 last:pb-0', className)}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between px-0 h-auto py-2 hover:bg-transparent"
      >
        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            !isOpen && '-rotate-90'
          )}
        />
      </Button>
      {isOpen && <div className="mt-3 overflow-hidden">{children}</div>}
    </div>
  );
};
