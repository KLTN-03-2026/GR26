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
                  'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-200 border-2',
                  isCompleted && 'bg-green-500 border-green-500 text-white',
                  isCurrent && 'bg-orange-500 border-orange-500 text-white',
                  !isCompleted && !isCurrent && 'bg-white border-gray-200 text-gray-400'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium transition-colors',
                  isCompleted && 'text-green-600',
                  isCurrent && 'text-orange-600',
                  !isCompleted && !isCurrent && 'text-gray-400'
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
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
