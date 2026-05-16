import { type KeyboardEvent, useState } from 'react';
import { BranchAddressAutocomplete } from '@modules/branch/components/BranchAddressAutocomplete';
import { useEditBranch } from '@modules/branch/hooks/useEditBranch';
import type { Branch, EditBranchFormData } from '@modules/branch/types/branch.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';

interface EditBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch;
  onSuccess?: () => void;
}

/**
 * Dialog chỉnh sửa chi nhánh theo đúng contract backend hiện tại.
 * Backend nhận thông tin cơ bản và tọa độ GPS để phục vụ check-in theo vị trí.
 */
export const EditBranchDialog = ({
  open,
  onOpenChange,
  branch,
  onSuccess,
}: EditBranchDialogProps) => {
  const { mutate, isPending } = useEditBranch();
  const [formData, setFormData] = useState<EditBranchFormData>({
    name: branch.name,
    code: branch.code,
    address: branch.address ?? '',
    phone: branch.phone ?? '',
    latitude: branch.latitude ?? null,
    longitude: branch.longitude ?? null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EditBranchFormData, string>>>({});

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof EditBranchFormData, string>> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Tên chi nhánh không được để trống';
    } else if (formData.name.trim().length > 100) {
      nextErrors.name = 'Tên chi nhánh không vượt quá 100 ký tự';
    }

    if (!formData.code.trim()) {
      nextErrors.code = 'Mã chi nhánh không được để trống';
    } else if (formData.code.trim().length > 50) {
      nextErrors.code = 'Mã chi nhánh không vượt quá 50 ký tự';
    }

    if (formData.address.trim().length > 255) {
      nextErrors.address = 'Địa chỉ không vượt quá 255 ký tự';
    }

    if (formData.phone.trim().length > 20) {
      nextErrors.phone = 'Số điện thoại không vượt quá 20 ký tự';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    mutate(
      {
        id: branch.id,
        payload: {
          name: formData.name.trim(),
          code: formData.code.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Chỉnh sửa thông tin chi nhánh
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4" onKeyDown={handleKeyDown}>
          <div className="grid gap-2">
            <Label htmlFor="edit-name">
              Tên chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(event) =>
                setFormData({ ...formData, name: event.target.value })
              }
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Nhập tên chi nhánh"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-code">
              Mã chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-code"
              value={formData.code}
              onChange={(event) =>
                setFormData({ ...formData, code: event.target.value })
              }
              className={errors.code ? 'border-red-500' : ''}
              placeholder="VD: BR-Q1-001"
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-address">Địa chỉ</Label>
            <BranchAddressAutocomplete
              id="edit-address"
              value={{
                address: formData.address,
                latitude: formData.latitude,
                longitude: formData.longitude,
              }}
              error={errors.address}
              placeholder="Nhập địa chỉ chi tiết"
              onChange={(addressData) => setFormData({ ...formData, ...addressData })}
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-phone">Số điện thoại</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(event) =>
                setFormData({ ...formData, phone: event.target.value })
              }
              className={errors.phone ? 'border-red-500' : ''}
              placeholder="Nhập số điện thoại"
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
