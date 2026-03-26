import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { cn } from '@shared/utils/cn';
import type { CreateBranchFormData } from '@modules/branch/types/branch.types';

interface Step1BasicInfoProps {
  data: CreateBranchFormData;
  onChange: (data: CreateBranchFormData) => void;
  errors?: Record<string, string>;
}

const cities = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Biên Hòa',
  'Nha Trang',
  'Huế',
  'Vũng Tàu',
];

export const Step1BasicInfo = ({ data, onChange, errors }: Step1BasicInfoProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateBranchFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...data, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onChange({ ...data, image: null });
    setImagePreview(null);
  };

  return (
    <div className="space-y-3 px-1">
      {/* THÔNG TIN CHI NHÁNH */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          THÔNG TIN CHI NHÁNH
        </h3>

        {/* Row 1: Tên, Mã, Thành phố - 3 cột */}
        <div className="grid grid-cols-3 gap-3">
          {/* Tên chi nhánh */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-gray-700">
              Tên chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Chi Nhánh Quận 7"
              value={data.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(
                'h-9 focus-visible:ring-orange-500 focus-visible:border-orange-500',
                errors?.name && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {errors?.name && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <span>⚠</span> {errors.name}
              </p>
            )}
          </div>

          {/* Mã chi nhánh */}
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-xs font-medium text-gray-700">
              Mã chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              placeholder="CN-13-433"
              value={data.code || ''}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className={cn(
                'h-9 focus-visible:ring-orange-500 focus-visible:border-orange-500',
                errors?.code && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {errors?.code && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <span>⚠</span> {errors.code}
              </p>
            )}
          </div>

          {/* Thành phố */}
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-medium text-gray-700">
              Thành phố <span className="text-red-500">*</span>
            </Label>
            <Select value={data.city || ''} onValueChange={(value) => handleInputChange('city', value)}>
              <SelectTrigger
                id="city"
                className={cn(
                  'h-9 focus:ring-orange-500 focus:border-orange-500',
                  errors?.city && 'border-red-500 focus:ring-red-500'
                )}
              >
                <SelectValue placeholder="Chọn thành phố" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.city && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <span>⚠</span> {errors.city}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Địa chỉ - full width */}
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="address" className="text-xs font-medium text-gray-700">
            Địa chỉ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            placeholder="374 tôn đản"
            value={data.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={cn(
              'h-9 focus-visible:ring-orange-500 focus-visible:border-orange-500',
              errors?.address && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          {errors?.address && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <span>⚠</span> {errors.address}
            </p>
          )}
        </div>

        {/* Row 3: Phone, Manager, Tax - 3 cột */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
              Số điện thoại <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="0934970856"
              value={data.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={cn(
                'h-9 focus-visible:ring-orange-500 focus-visible:border-orange-500',
                errors?.phone && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {errors?.phone && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                <span>⚠</span> {errors.phone}
              </p>
            )}
          </div>

          {/* Quản lý chi nhánh */}
          <div className="space-y-1.5">
            <Label htmlFor="managerId" className="text-xs font-medium text-gray-700">
              Quản lý chi nhánh
            </Label>
            <Select
              value={data.managerId || 'none'}
              onValueChange={(value) => handleInputChange('managerId', value === 'none' ? '' : value)}
            >
              <SelectTrigger id="managerId" className="h-9">
                <SelectValue placeholder="Chưa có" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chưa có</SelectItem>
                <SelectItem value="manager-1">Lê Văn Nam</SelectItem>
                <SelectItem value="manager-2">Nguyễn Thị Mai</SelectItem>
                <SelectItem value="manager-3">Trần Văn Hùng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mã số thuế */}
          <div className="space-y-1.5">
            <Label htmlFor="taxCode" className="text-xs font-medium text-gray-700">
              Mã số thuế
            </Label>
            <Input
              id="taxCode"
              placeholder="028 1234 5678"
              value={data.taxCode || ''}
              onChange={(e) => handleInputChange('taxCode', e.target.value)}
              className="h-9 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>
        </div>

        {/* Row 4: Ghi chú - full width */}
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
            Ghi chú
          </Label>
          <textarea
            id="notes"
            placeholder="Thêm ghi chú..."
            rows={2}
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            value={data.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />
        </div>
      </div>

      {/* ẢNH CHI NHÁNH */}
      <div className="space-y-1.5 pt-2">
        <Label className="text-xs font-medium text-gray-700">Ảnh chi nhánh</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Tải ảnh lên</p>
              <p className="text-xs text-gray-400">PNG, JPG (max. 5MB)</p>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
