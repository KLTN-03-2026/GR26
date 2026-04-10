import { Check } from 'lucide-react';
import { cn } from '@shared/utils/cn';

interface Step {
  id: number;
  label: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
}

/**
 * Component stepper cho wizard form
 * Hiển thị tiến trình các bước với số thứ tự và checkmark cho bước đã hoàn thành
 */
export const FormStepper = ({ steps, currentStep }: FormStepperProps) => {
  return (
    <div className="flex items-center justify-center ">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200',
                  isCompleted && 'border-success-text bg-success-light text-success-text',
                  isCurrent && 'border-primary bg-primary-light text-primary',
                  !isCompleted && !isCurrent && 'border-border bg-card text-text-secondary'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium transition-colors',
                  isCompleted && 'text-success-text',
                  isCurrent && 'text-primary',
                  !isCompleted && !isCurrent && 'text-text-secondary'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'w-24 h-0.5 mx-4 transition-colors',
                  isCompleted ? 'bg-success-text' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
