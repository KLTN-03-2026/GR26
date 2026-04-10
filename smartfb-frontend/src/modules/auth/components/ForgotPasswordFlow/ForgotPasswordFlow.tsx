import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForgotPasswordFlow, FORGOT_PASSWORD_STEPS } from '@modules/auth/hooks/useForgotPasswordFlow';
import { FormStepper } from '@shared/components/common/FormStepper';
import { BrandLogo } from '@shared/components/layout/BrandLogo';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';
import { ForgotPasswordRequestStep } from './ForgotPasswordRequestStep';
import { ForgotPasswordVerifyStep } from './ForgotPasswordVerifyStep';
import { ForgotPasswordResetStep } from './ForgotPasswordResetStep';
import { ForgotPasswordSuccessStep } from './ForgotPasswordSuccessStep';

/**
 * UI chính cho flow quên mật khẩu.
 */
export const ForgotPasswordFlow = () => {
  const {
    currentStep,
    forgotPasswordForm,
    isRequestStep,
    isRequestingOtp,
    isResetStep,
    isResettingPassword,
    isSuccessStep,
    isVerifyStep,
    isVerifyingOtp,
    newPassword,
    recoveryEmail,
    resetPasswordForm,
    showConfirmPassword,
    showNewPassword,
    stepDescription,
    stepTitle,
    verificationMessage,
    verifyOtpForm,
    onBackToEmailStep,
    onRequestOtp,
    onResendOtp,
    onResetPassword,
    onStartOver,
    onToggleConfirmPasswordVisibility,
    onToggleNewPasswordVisibility,
    onVerifyOtp,
  } = useForgotPasswordFlow();

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <BrandLogo
            className="gap-3"
            iconClassName="h-14 w-14 drop-shadow-lg"
            textClassName="text-3xl text-text-primary"
          />
          <Button
            asChild
            variant="ghost"
            className="text-text-secondary hover:bg-primary-light hover:text-primary"
          >
            <Link to={ROUTES.LOGIN}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
          <div className="border-b border-border bg-gradient-to-br from-card via-primary-light to-card px-8 py-8">
            <div className="mb-8">
              <FormStepper steps={[...FORGOT_PASSWORD_STEPS]} currentStep={currentStep} />
            </div>

            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">{stepTitle}</h1>
              <p className="mx-auto max-w-xl text-sm leading-6 text-text-secondary">{stepDescription}</p>
            </div>
          </div>

          <div className="space-y-6 px-8 py-8">
            {!isRequestStep && recoveryEmail ? (
              <div className="rounded-card border border-primary-light bg-primary-light px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Email khôi phục</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{recoveryEmail}</p>
              </div>
            ) : null}

            {isRequestStep ? (
              <ForgotPasswordRequestStep
                form={forgotPasswordForm}
                isPending={isRequestingOtp}
                onSubmit={onRequestOtp}
              />
            ) : null}

            {isVerifyStep ? (
              <ForgotPasswordVerifyStep
                form={verifyOtpForm}
                isRequestingOtp={isRequestingOtp}
                isVerifyingOtp={isVerifyingOtp}
                onBackToEmailStep={onBackToEmailStep}
                onResendOtp={onResendOtp}
                onSubmit={onVerifyOtp}
              />
            ) : null}

            {isResetStep ? (
              <ForgotPasswordResetStep
                form={resetPasswordForm}
                isPending={isResettingPassword}
                newPassword={newPassword}
                showConfirmPassword={showConfirmPassword}
                showNewPassword={showNewPassword}
                verificationMessage={verificationMessage}
                onBackToEmailStep={onBackToEmailStep}
                onSubmit={onResetPassword}
                onToggleConfirmPasswordVisibility={onToggleConfirmPasswordVisibility}
                onToggleNewPasswordVisibility={onToggleNewPasswordVisibility}
              />
            ) : null}

            {isSuccessStep ? (
              <ForgotPasswordSuccessStep
                recoveryEmail={recoveryEmail}
                onStartOver={onStartOver}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
