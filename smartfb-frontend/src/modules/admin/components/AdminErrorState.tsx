import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface AdminErrorStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  className?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
}

/**
 * Error state chuẩn cho màn hình admin khi API trả lỗi hoặc thiếu dữ liệu bắt buộc.
 */
export const AdminErrorState = ({
  title,
  description,
  actionLabel = 'Tải lại',
  className,
  isRetrying = false,
  onRetry,
}: AdminErrorStateProps) => {
  return (
    <section
      className={cn(
        'grid min-h-[300px] place-items-center rounded-lg border border-admin-gray-200 bg-white p-8 shadow-sm',
        className
      )}
    >
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-admin-error-light text-admin-error">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-admin-gray-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-admin-gray-500">
          {description}
        </p>
        {onRetry ? (
          <Button
            type="button"
            className="mt-5 bg-admin-brand-500 hover:bg-admin-brand-600"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
};
