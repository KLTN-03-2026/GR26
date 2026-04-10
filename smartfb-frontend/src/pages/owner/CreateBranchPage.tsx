import { useState } from 'react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Step1BasicInfo } from '@modules/branch/components/form-steps';
import { useCreateBranch } from '@modules/branch/hooks/useCreateBranch';
import { step1Schema } from '@modules/branch/schemas';
import type { CreateBranchFormData, CreateBranchPayload } from '@modules/branch/types/branch.types';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';
import type { ZodError } from 'zod';

const INITIAL_FORM_DATA: CreateBranchFormData = {
  name: '',
  code: '',
  address: '',
  phone: '',
};

/**
 * Validate dữ liệu form theo đúng schema backend đang yêu cầu.
 *
 * @param formData - dữ liệu người dùng nhập trên form tạo chi nhánh
 * @returns Danh sách lỗi theo field hoặc `null` nếu dữ liệu hợp lệ
 */
const validateCreateBranchForm = (
  formData: CreateBranchFormData
): Record<string, string> | null => {
  try {
    step1Schema.parse(formData);
    return null;
  } catch (error) {
    const fieldErrors: Record<string, string> = {};
    const zodError = error as ZodError;

    zodError.issues.forEach((issue) => {
      const fieldName = issue.path.join('.');
      fieldErrors[fieldName] = issue.message;
    });

    return fieldErrors;
  }
};

/**
 * Chuẩn hóa dữ liệu form trước khi gọi API tạo chi nhánh.
 *
 * @param formData - dữ liệu thô từ state của form
 * @returns Payload đã được trim để gửi tới backend
 */
const toCreateBranchPayload = (formData: CreateBranchFormData): CreateBranchPayload => {
  return {
    name: formData.name.trim(),
    code: formData.code.trim(),
    address: formData.address.trim(),
    phone: formData.phone.trim(),
  };
};

/**
 * Trang tạo chi nhánh theo flow hiện tại của backend.
 * Backend chỉ hỗ trợ tạo chi nhánh với các trường cơ bản nên UI được rút gọn về 1 form.
 */
export default function CreateBranchPage() {
  const navigate = useNavigate();
  const { mutate: createBranch, isPending } = useCreateBranch();

  const [formData, setFormData] = useState<CreateBranchFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isFormDirty = Object.values(formData).some((value) => value.trim() !== '');

  const handleCancel = () => {
    if (hasUnsavedChanges && isFormDirty) {
      const shouldLeave = window.confirm('Bạn có dữ liệu chưa lưu. Bạn có chắc muốn hủy?');

      if (!shouldLeave) {
        return;
      }
    }

    navigate(ROUTES.OWNER.BRANCHES);
  };

  /**
   * Cập nhật từng phần dữ liệu form và xóa lỗi của các field vừa được sửa.
   *
   * @param data - phần dữ liệu mới từ component form
   */
  const handleFormChange = (data: Partial<CreateBranchFormData>) => {
    setFormData((previousData) => ({
      ...previousData,
      ...data,
    }));
    setHasUnsavedChanges(true);

    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };

      Object.keys(data).forEach((fieldName) => {
        delete nextErrors[fieldName];
      });

      return nextErrors;
    });
  };

  /**
   * Submit form tạo chi nhánh theo payload backend hiện tại.
   *
   * @param event - sự kiện submit từ form HTML
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateCreateBranchForm(formData);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    createBranch(toCreateBranchPayload(formData), {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        navigate(ROUTES.OWNER.BRANCHES);
      },
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            className="h-9 w-9 p-0"
            disabled={isPending}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Thêm chi nhánh mới</h1>
            <p className="text-sm text-text-secondary">Tạo chi nhánh mới với các thông tin cơ bản.</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="border-border text-text-primary hover:bg-hover-light"
          disabled={isPending}
        >
          Hủy
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-card border border-border bg-card p-6 shadow-card">
        <Step1BasicInfo data={formData} onChange={handleFormChange} errors={errors} />

        <div className="flex items-center justify-end border-t border-border pt-6">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary px-6 font-medium text-white hover:bg-primary-hover"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Đang tạo chi nhánh...
              </span>
            ) : (
              'Tạo chi nhánh'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
