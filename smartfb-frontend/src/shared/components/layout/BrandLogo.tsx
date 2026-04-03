import { type FC } from 'react';
import logoIcon from '@assets/logo.svg';
import { cn } from '@shared/utils/cn';

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  wordmark?: string;
}

/**
 * Hiển thị bộ nhận diện thương hiệu SmartF&B dùng chung trong toàn ứng dụng.
 * Logo SVG luôn đứng cạnh wordmark để giữ nhận diện nhất quán giữa auth và app shell.
 */
export const BrandLogo: FC<BrandLogoProps> = ({
  className,
  iconClassName,
  textClassName,
  wordmark = 'martF&B',
}) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)} aria-label="SmartF&B">
      <img
        src={logoIcon}
        alt="Logo SmartF&B"
        className={cn('h-10 w-10 shrink-0 object-contain', iconClassName)}
      />
      <span
        className={cn(
          'whitespace-nowrap text-xl font-bold tracking-tight text-[#e8692a]',
          textClassName
        )}
      >
        {wordmark}
      </span>
    </div>
  );
};
