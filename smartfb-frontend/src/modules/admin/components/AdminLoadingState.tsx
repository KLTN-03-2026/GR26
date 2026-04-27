import { cn } from '@shared/utils/cn';
import { Loader2 } from 'lucide-react';

interface AdminLoadingStateProps {
  title: string;
  description: string;
  className?: string;
}

/**
 * Loading state chuẩn cho các màn hình admin đang chờ dữ liệu API.
 */
export const AdminLoadingState = ({
  title,
  description,
  className,
}: AdminLoadingStateProps) => {
  return (
    <section
      className={cn(
        'grid min-h-[300px] place-items-center rounded-lg border border-admin-gray-200 bg-white p-8 shadow-sm',
        className
      )}
    >
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-admin-brand-500" />
        <h3 className="mt-4 text-lg font-semibold text-admin-gray-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-admin-gray-500">
          {description}
        </p>
      </div>
    </section>
  );
};
