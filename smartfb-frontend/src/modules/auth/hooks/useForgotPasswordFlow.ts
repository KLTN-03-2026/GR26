import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useForgotPassword } from '@modules/auth/hooks/useForgotPassword';
import { useResetPassword } from '@modules/auth/hooks/useResetPassword';
import { useVerifyOtp } from '@modules/auth/hooks/useVerifyOtp';
import { useToast } from '@shared/hooks/useToast';

export interface ForgotPasswordRequestFormValues {
  email: string;
}

export interface VerifyOtpFormValues {
  otp: string;
}

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export type ForgotPasswordStep = 1 | 2 | 3 | 4;

export const FORGOT_PASSWORD_STEPS = [
  { id: 1, label: 'Email' },
  { id: 2, label: 'OTP' },
  { id: 3, label: 'Mật khẩu' },
] as const;

export const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const OTP_PATTERN = /^\d{6}$/;

const getStepTitle = (currentStep: ForgotPasswordStep): string => {
  switch (currentStep) {
    case 1:
      return 'Khôi phục mật khẩu';
    case 2:
      return 'Xác thực mã OTP';
    case 3:
      return 'Đặt mật khẩu mới';
    default:
      return 'Khôi phục thành công';
  }
};

const getStepDescription = (currentStep: ForgotPasswordStep): string => {
  switch (currentStep) {
    case 1:
      return 'Nhập email đã đăng ký để SmartF&B gửi mã xác thực khôi phục tài khoản.';
    case 2:
      return 'Nhập mã OTP 6 số bạn vừa nhận được để tiếp tục quá trình khôi phục.';
    case 3:
      return 'Tạo mật khẩu mới đủ mạnh để đăng nhập lại vào hệ thống.';
    default:
      return 'Mật khẩu đã được cập nhật. Bạn có thể dùng mật khẩu mới để đăng nhập.';
  }
};

/**
 * Hook điều phối toàn bộ flow quên mật khẩu 4 bước.
 * UI chỉ cần render theo step hiện tại và gọi các action được expose ra.
 */
export const useForgotPasswordFlow = () => {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { error } = useToast();
  const { mutateAsync: requestForgotPassword, isPending: isRequestingOtp } = useForgotPassword();
  const { mutateAsync: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp();
  const { mutateAsync: resetPassword, isPending: isResettingPassword } = useResetPassword();

  const forgotPasswordForm = useForm<ForgotPasswordRequestFormValues>({
    defaultValues: {
      email: '',
    },
  });

  const verifyOtpForm = useForm<VerifyOtpFormValues>({
    defaultValues: {
      otp: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = useWatch({
    control: resetPasswordForm.control,
    name: 'newPassword',
  });

  const resetResetPasswordForm = () => {
    resetPasswordForm.reset({
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleBackToEmailStep = () => {
    setCurrentStep(1);
    setResetToken('');
    setVerificationMessage('');
    verifyOtpForm.reset({ otp: '' });
    resetResetPasswordForm();
    forgotPasswordForm.setValue('email', recoveryEmail);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setRecoveryEmail('');
    setResetToken('');
    setVerificationMessage('');
    forgotPasswordForm.reset({ email: '' });
    verifyOtpForm.reset({ otp: '' });
    resetResetPasswordForm();
  };

  const handleRequestOtp = async (values: ForgotPasswordRequestFormValues) => {
    const normalizedEmail = values.email.trim().toLowerCase();

    await requestForgotPassword({
      email: normalizedEmail,
    });

    // Giữ email đã xác nhận để các bước sau luôn dùng đúng một nguồn dữ liệu.
    setRecoveryEmail(normalizedEmail);
    setResetToken('');
    setVerificationMessage('');
    setCurrentStep(2);
    verifyOtpForm.reset({ otp: '' });
    resetResetPasswordForm();
  };

  const handleResendOtp = async () => {
    if (!recoveryEmail) {
      error('Thiếu email khôi phục', 'Vui lòng nhập lại email để nhận mã OTP mới.');
      setCurrentStep(1);
      return;
    }

    await requestForgotPassword({
      email: recoveryEmail,
    });
  };

  const handleVerifyOtp = async (values: VerifyOtpFormValues) => {
    if (!recoveryEmail) {
      error('Thiếu email khôi phục', 'Vui lòng nhập lại email để bắt đầu lại.');
      setCurrentStep(1);
      return;
    }

    const response = await verifyOtp({
      email: recoveryEmail,
      otp: values.otp,
    });

    setResetToken(response.data.resetToken);
    setVerificationMessage(response.data.message);
    setCurrentStep(3);
    resetResetPasswordForm();
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    if (!recoveryEmail || !resetToken) {
      error('Phiên khôi phục không hợp lệ', 'Vui lòng xác thực OTP lại trước khi đổi mật khẩu.');
      setCurrentStep(recoveryEmail ? 2 : 1);
      return;
    }

    await resetPassword({
      email: recoveryEmail,
      resetToken,
      newPassword: values.newPassword,
    });

    setResetToken('');
    setCurrentStep(4);
  };

  return {
    currentStep,
    forgotPasswordForm,
    isRequestStep: currentStep === 1,
    isRequestingOtp,
    isResetStep: currentStep === 3,
    isResettingPassword,
    isSuccessStep: currentStep === 4,
    isVerifyStep: currentStep === 2,
    isVerifyingOtp,
    newPassword,
    recoveryEmail,
    resetPasswordForm,
    showConfirmPassword,
    showNewPassword,
    stepDescription: getStepDescription(currentStep),
    stepTitle: getStepTitle(currentStep),
    verificationMessage,
    verifyOtpForm,
    onBackToEmailStep: handleBackToEmailStep,
    onRequestOtp: handleRequestOtp,
    onResendOtp: handleResendOtp,
    onResetPassword: handleResetPassword,
    onStartOver: handleStartOver,
    onToggleConfirmPasswordVisibility: () => {
      setShowConfirmPassword((previousState) => !previousState);
    },
    onToggleNewPasswordVisibility: () => {
      setShowNewPassword((previousState) => !previousState);
    },
    onVerifyOtp: handleVerifyOtp,
  };
};
