import { useState, useMemo, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { FormStepper } from "@shared/components/common/FormStepper";
import { Step1BasicInfo } from "./form-steps/Step1BasicInfo";
import { Step2Operations } from "./form-steps/Step2Operations";
import { Step3Confirmation } from "./form-steps/Step3Confirmation";
import type { CreateBranchFormData, CreateBranchFormValues } from "@modules/branch/types/branch.types";
import { step1Schema } from "../schemas/step1Schema";
import { step2Schema } from "../schemas/step2Schema";
import { step3Schema } from "../schemas/step3Schema";
import type { ZodError } from "zod";

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: CreateBranchFormData) => void;
}

const STEPS: { id: number; label: string }[] = [
  { id: 1, label: "Thông tin cơ bản" },
  { id: 2, label: "Vận hành" },
  { id: 3, label: "Xác nhận" },
];

const DEFAULT_SCHEDULE = {
  monday: { enabled: true, openTime: "07:00", closeTime: "22:30" },
  tuesday: { enabled: true, openTime: "07:00", closeTime: "22:30" },
  wednesday: { enabled: true, openTime: "07:00", closeTime: "22:30" },
  thursday: { enabled: true, openTime: "07:00", closeTime: "22:30" },
  friday: { enabled: true, openTime: "07:00", closeTime: "22:30" },
  saturday: { enabled: true, openTime: "08:00", closeTime: "23:00" },
  sunday: { enabled: false, openTime: "08:00", closeTime: "23:00" },
} as const;

const INITIAL_FORM_DATA: CreateBranchFormValues = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  managerId: "",
  taxCode: "",
  notes: "",
  workingSchedule: DEFAULT_SCHEDULE,
  integrations: { grabfood: false, shopeefood: false },
  tableSetupOption: "use-template",
  menuSetupOption: "copy-menu",
};

const getSchemaForStep = (step: number) => {
  switch (step) {
    case 1: return step1Schema;
    case 2: return step2Schema;
    case 3: return step3Schema;
    default: return step1Schema;
  }
};

/**
 * Dialog wizard 3 bước tạo chi nhánh mới
 */
export const CreateBranchDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: CreateBranchDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateBranchFormData>>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCurrentStep = useCallback((data: Partial<CreateBranchFormData>, step: number): Record<string, string> | null => {
    const schema = getSchemaForStep(step);
    try {
      schema.parse(data);
      return null;
    } catch (error) {
      const fieldErrors: Record<string, string> = {};
      const zodError = error as ZodError;
      zodError.issues.forEach((err) => {
        const fieldName = err.path.join('.');
        fieldErrors[fieldName] = err.message;
      });
      return fieldErrors;
    }
  }, []);

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit(formData as CreateBranchFormData);
    }
    handleClose();
  }, [onSubmit, formData, handleClose]);

  const handleNext = useCallback(() => {
    const validationErrors = validateCurrentStep(formData, currentStep);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }, [formData, currentStep, validateCurrentStep, handleSubmit]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    setErrors({});
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentStep, handleClose]);

  const updateFormData = useCallback((data: Partial<CreateBranchFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const summaryData = useMemo(() => ({
    name: formData.name,
    address: formData.address,
    city: formData.city,
    phone: formData.phone,
    workingDays: formData.workingSchedule
      ? Object.values(formData.workingSchedule).filter((day) => day.enabled).length
      : 0,
    integrations: [
      formData.integrations?.grabfood && "GrabFood",
      formData.integrations?.shopeefood && "ShopeeFood",
    ].filter(Boolean) as string[],
  }), [formData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden scrollbar-hide flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Thêm chi nhánh mới
            </DialogTitle>
            <DialogClose className="rounded-lg p-1 hover:bg-gray-100 transition-colors">
              {/* <X className="w-5 h-5 text-gray-500" />÷ */}
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex-shrink-0">
          <FormStepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Form content - scrollable */}
        <div className="flex-1 overflow-y-auto ">
          {currentStep === 1 && (
            <Step1BasicInfo
              data={formData}
              onChange={updateFormData}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <Step2Operations
              data={formData}
              onChange={updateFormData}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <Step3Confirmation
              data={formData}
              onChange={updateFormData}
              errors={errors}
              summaryData={summaryData}
            />
          )}
        </div>

        {/* Actions - fixed at bottom */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-gray-200">
          <Button variant="ghost" onClick={handleSkip} className="text-gray-600 hover:text-gray-900">
            {currentStep === 2 ? "Bỏ qua bước này" : "Hủy"}
          </Button>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Quay lại
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6"
            >
              {currentStep < 3 ? (
                <span className="flex items-center gap-2">
                  Tiếp theo
                  <ChevronRight className="w-4 h-4" />
                </span>
              ) : (
                "Hoàn thành"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
