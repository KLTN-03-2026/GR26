import { Building2, CircleAlert, Phone } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/utils/cn';
import type { CreateBranchFormData } from '@modules/branch/types/branch.types';

interface Step1BasicInfoProps {
  data: CreateBranchFormData;
  onChange: (data: Partial<CreateBranchFormData>) => void;
  errors?: Record<string, string>;
}

/**
 * Form thông tin cơ bản cho luồng tạo chi nhánh hiện tại.
 * Chỉ hiển thị các field mà backend đang hỗ trợ ở endpoint tạo chi nhánh.
 */
export const Step1BasicInfo = ({ data, onChange, errors }: Step1BasicInfoProps) => {
  /**
   * Cập nhật dữ liệu cho từng field trong form thông tin cơ bản.
   *
   * @param field - tên field cần cập nhật
   * @param value - giá trị mới của field
   */
  const handleInputChange = <K extends keyof CreateBranchFormData>(
    field: K,
    value: CreateBranchFormData[K]
  ) => {
    onChange({ [field]: value } as Pick<CreateBranchFormData, K>);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">Flow tạo chi nhánh hiện tại của backend</p>
            <p className="text-sm text-amber-800">
              Endpoint tạo chi nhánh hiện chỉ nhận 4 trường: tên chi nhánh, mã chi nhánh, địa chỉ và số điện
              thoại. Các cấu hình như giờ hoạt động, tích hợp, bàn và menu sẽ được thiết lập ở bước sau khi
              backend có endpoint tương ứng.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Thông tin chi nhánh</h2>
            <p className="text-sm text-gray-500">Nhập đúng dữ liệu backend đang yêu cầu để tạo chi nhánh.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Tên chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Chi nhánh Quận 7"
              value={data.name}
              onChange={(event) => handleInputChange('name', event.target.value)}
              className={cn(
                'h-10 focus-visible:border-orange-500 focus-visible:ring-orange-500',
                errors?.name && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {errors?.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-sm font-medium text-gray-700">
              Mã chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              placeholder="CN-Q7"
              value={data.code}
              onChange={(event) => handleInputChange('code', event.target.value)}
              className={cn(
                'h-10 uppercase focus-visible:border-orange-500 focus-visible:ring-orange-500',
                errors?.code && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            <p className="text-xs text-gray-500">Backend chỉ yêu cầu mã không rỗng và tối đa 50 ký tự.</p>
            {errors?.code && <p className="text-sm text-red-600">{errors.code}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Địa chỉ
          </Label>
          <Textarea
            id="address"
            placeholder="374 Tôn Đản, Phường 4, Quận 4, TP. Hồ Chí Minh"
            value={data.address}
            onChange={(event) => handleInputChange('address', event.target.value)}
            className={cn(
              'min-h-[96px] focus-visible:border-orange-500 focus-visible:ring-orange-500',
              errors?.address && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          <p className="text-xs text-gray-500">Backend cho phép để trống, nhưng nên nhập địa chỉ để dễ quản lý.</p>
          {errors?.address && <p className="text-sm text-red-600">{errors.address}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Số điện thoại
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="phone"
              placeholder="0901234567"
              value={data.phone}
              onChange={(event) => handleInputChange('phone', event.target.value)}
              className={cn(
                'h-10 pl-10 focus-visible:border-orange-500 focus-visible:ring-orange-500',
                errors?.phone && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
          </div>
          <p className="text-xs text-gray-500">Backend hiện chỉ giới hạn tối đa 20 ký tự cho số điện thoại.</p>
          {errors?.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>
    </div>
  );
};
