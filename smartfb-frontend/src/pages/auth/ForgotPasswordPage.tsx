import { ForgotPasswordFlow } from '@modules/auth/components/ForgotPasswordFlow/ForgotPasswordFlow';
import { PageMeta } from '@shared/components/common/PageMeta';

export default function ForgotPasswordPage() {
  return (
    <>
      <PageMeta
        title="Quên mật khẩu"
        description="Khôi phục mật khẩu SmartF&B qua email OTP để tiếp tục quản lý vận hành quán và chuỗi chi nhánh."
        noIndex
      />
      <ForgotPasswordFlow />
    </>
  );
}
