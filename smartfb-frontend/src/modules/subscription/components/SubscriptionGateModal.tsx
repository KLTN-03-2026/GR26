import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { cn } from '@shared/utils/cn';
import { getBlockedMessage, getStatusLabel } from './subscriptionGate.utils';
import type { SubscriptionBlockedStateProps } from './subscriptionGate.types';

/**
 * Modal khóa thao tác khi tenant chưa đủ điều kiện sử dụng tính năng nghiệp vụ.
 */
export const SubscriptionGateModal = ({
  status,
  isOwner,
  onOpenPackages,
  onRetry,
  isRetrying = false,
  mode = 'blocked',
}: SubscriptionBlockedStateProps) => {
  const isErrorMode = mode === 'error';
  const title = (() => {
    if (isErrorMode) {
      return 'Không thể kiểm tra gói dịch vụ';
    }

    return 'Tài khoản cần thanh toán gói dịch vụ';
  })();
  const description = (() => {
    if (isErrorMode) {
      return 'Hệ thống chưa kiểm tra được trạng thái gói dịch vụ. Vui lòng thử lại trước khi tiếp tục sử dụng.';
    }

    return getBlockedMessage(status ?? 'UNKNOWN');
  })();

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-xl text-center [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div
          className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-full',
            isErrorMode ? 'bg-red-50 text-red-600' : 'bg-warning-light text-warning-text'
          )}
        >
          <AlertTriangle className="h-7 w-7" />
        </div>

        <DialogHeader className="mt-2 text-center sm:text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
            Subscription gate
          </p>
          <DialogTitle className="text-xl font-bold text-text-primary">{title}</DialogTitle>
          <DialogDescription className="mx-auto max-w-md text-sm leading-6 text-text-secondary">
            {description}
          </DialogDescription>
        </DialogHeader>

        {!isErrorMode && status ? (
          <p className="mt-4 text-sm text-text-secondary">
            Trạng thái hiện tại: <span className="font-semibold text-text-primary">{getStatusLabel(status)}</span>
          </p>
        ) : null}

        <DialogFooter className="mt-4 flex-col gap-3 sm:flex-col sm:justify-center sm:space-x-0">
          {isOwner && !isErrorMode ? (
            <Button type="button" onClick={onOpenPackages}>
              <CreditCard className="h-4 w-4" />
              Đi tới gói dịch vụ
            </Button>
          ) : null}

          {isErrorMode && onRetry ? (
            <Button type="button" onClick={onRetry} disabled={isRetrying}>
              <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
              Thử lại
            </Button>
          ) : null}

          {!isOwner && !isErrorMode ? (
            <p className="text-sm font-medium text-text-secondary">
              Vui lòng liên hệ chủ quán để thanh toán hoặc gia hạn gói dịch vụ.
            </p>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
