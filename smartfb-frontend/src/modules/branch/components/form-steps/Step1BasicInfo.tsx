import { Building2, Phone } from 'lucide-react';
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
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Thông tin chi nhánh</h2>
            <p className="text-sm text-gray-500">Điền thông tin cơ bản để tạo chi nhánh mới.</p>
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
            <p className="text-xs text-gray-500">Nhập mã chi nhánh ngắn gọn, tối đa 50 ký tự.</p>
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
          <p className="text-xs text-gray-500">Có thể để trống nếu chưa có, nhưng nên nhập để dễ quản lý.</p>
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
          <p className="text-xs text-gray-500">Số điện thoại tối đa 20 ký tự.</p>
          {errors?.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>
    </div>
  );
};
