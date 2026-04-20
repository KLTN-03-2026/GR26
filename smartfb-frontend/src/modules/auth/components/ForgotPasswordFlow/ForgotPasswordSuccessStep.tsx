import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';

interface ForgotPasswordSuccessStepProps {
  recoveryEmail: string;
  onStartOver: () => void;
}

/**
 * Bước hoàn tất sau khi đổi mật khẩu thành công.
 */
export const ForgotPasswordSuccessStep = ({
  recoveryEmail,
  onStartOver,
}: ForgotPasswordSuccessStepProps) => {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-light text-success-text">
        <CheckCircle2 className="h-10 w-10" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-text-primary">Mật khẩu đã được cập nhật</h2>
        <p className="text-sm leading-6 text-text-secondary">
          Tài khoản <span className="font-semibold text-text-primary">{recoveryEmail}</span> đã sẵn sàng để đăng nhập bằng mật khẩu mới.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="h-12 flex-1 bg-primary text-base font-semibold text-white shadow-card hover:bg-primary-hover"
        >
          <Link to={ROUTES.LOGIN}>Đăng nhập ngay</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 border-border text-text-secondary hover:bg-hover-light hover:text-text-primary"
          onClick={onStartOver}
        >
          Khôi phục tài khoản khác
        </Button>
      </div>
    </div>
  );
};
