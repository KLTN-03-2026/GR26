import { Controller, type UseFormReturn } from 'react-hook-form';
import { RefreshCcw } from 'lucide-react';
import { OtpCodeInput } from '@modules/auth/components/OtpCodeInput';
import { OTP_PATTERN, type VerifyOtpFormValues } from '@modules/auth/hooks/useForgotPasswordFlow';
import { Button } from '@shared/components/ui/button';
import { Label } from '@shared/components/ui/label';

interface ForgotPasswordVerifyStepProps {
  form: UseFormReturn<VerifyOtpFormValues>;
  isRequestingOtp: boolean;
  isVerifyingOtp: boolean;
  onBackToEmailStep: () => void;
  onResendOtp: () => Promise<void>;
  onSubmit: (values: VerifyOtpFormValues) => Promise<void>;
}

/**
 * Bước xác thực OTP và cho phép gửi lại mã khi cần.
 */
export const ForgotPasswordVerifyStep = ({
  form,
  isRequestingOtp,
  isVerifyingOtp,
  onBackToEmailStep,
  onResendOtp,
  onSubmit,
}: ForgotPasswordVerifyStepProps) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="otp-0" className="text-sm font-semibold text-text-primary">
          Mã OTP 6 số
        </Label>
        <div>
          <Controller
            control={form.control}
            name="otp"
            rules={{
              required: 'Mã OTP không được để trống',
              pattern: {
                value: OTP_PATTERN,
                message: 'Mã OTP phải gồm đúng 6 chữ số',
              },
            }}
            render={({ field }) => (
              <OtpCodeInput
                inputIdPrefix="otp"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isRequestingOtp || isVerifyingOtp}
                hasError={Boolean(form.formState.touchedFields.otp && form.formState.errors.otp)}
              />
            )}
          />
        </div>
        {form.formState.touchedFields.otp && form.formState.errors.otp ? (
          <p className="text-sm text-red-600">{form.formState.errors.otp.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 border-border text-text-secondary hover:bg-hover-light hover:text-text-primary"
          onClick={onBackToEmailStep}
          disabled={isVerifyingOtp}
        >
          Đổi email
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 border-border text-text-secondary hover:bg-hover-light hover:text-text-primary"
          onClick={() => void onResendOtp()}
          disabled={isRequestingOtp || isVerifyingOtp}
        >
          {isRequestingOtp ? (
            <div className="flex items-center gap-2">
              <div className="spinner spinner-sm" />
              Đang gửi lại...
            </div>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Gửi lại mã
            </>
          )}
        </Button>
      </div>

      <Button
        type="submit"
        className="h-12 w-full bg-primary text-base font-semibold text-white shadow-card hover:bg-primary-hover"
        disabled={isVerifyingOtp}
      >
        {isVerifyingOtp ? (
          <div className="flex items-center gap-2">
            <div className="spinner spinner-sm" />
            Đang xác thực...
          </div>
        ) : (
          'Xác thực OTP'
        )}
      </Button>
    </form>
  );
};
