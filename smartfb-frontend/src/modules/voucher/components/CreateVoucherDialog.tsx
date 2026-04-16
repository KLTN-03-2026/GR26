/**
 * @author Đào Thu Thiên
 * @description Dialog tạo voucher mới
 * @created 2026-04-16
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useCreateVoucher } from '../hooks/useCreateVoucher';
import { createVoucherSchema, type CreateVoucherFormValues } from '../schemas/voucherSchema';
import type { DiscountType } from '../types/voucher.types';

interface CreateVoucherDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const initialFormData: CreateVoucherFormValues = {
    code: '',
    name: '',
    discountType: 'PERCENT',
    discountValue: 0,
    minOrderValue: null,
    startDate: '',
    endDate: '',
};

export const CreateVoucherDialog = ({
    open,
    onOpenChange,
    onSuccess,
}: CreateVoucherDialogProps) => {
    const { mutate, isPending } = useCreateVoucher();
    const [formData, setFormData] = useState<CreateVoucherFormValues>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof CreateVoucherFormValues, string>>>({});

    useEffect(() => {
        if (!open) {
            setFormData(initialFormData);
            setErrors({});
        }
    }, [open]);

    const validate = (): boolean => {
        const result = createVoucherSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Partial<Record<keyof CreateVoucherFormValues, string>> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as keyof CreateVoucherFormValues;
                if (path) {
                    fieldErrors[path] = issue.message;
                }
            });
            setErrors(fieldErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        mutate(formData, {
            onSuccess: (response) => {
                if (response.success) {
                    onOpenChange(false);
                    onSuccess?.();
                } else {
                    setErrors({ code: response.message });
                }
            },
        });
    };

    const updateField = <K extends keyof CreateVoucherFormValues>(
        field: K,
        value: CreateVoucherFormValues[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                        Tạo voucher mới
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="code">
                            Mã voucher <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                            className={errors.code ? 'border-red-500' : ''}
                            placeholder="VD: SUMMER30"
                        />
                        {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">
                            Tên chương trình <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className={errors.name ? 'border-red-500' : ''}
                            placeholder="VD: Khuyến mãi hè 30%"
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="discountType">Loại giảm giá</Label>
                            <select
                                id="discountType"
                                value={formData.discountType}
                                onChange={(e) => updateField('discountType', e.target.value as DiscountType)}
                                className="input"
                            >
                                <option value="PERCENT">Phần trăm (%)</option>
                                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discountValue">
                                Giá trị giảm <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="discountValue"
                                type="number"
                                value={formData.discountValue || ''}
                                onChange={(e) => updateField('discountValue', Number(e.target.value))}
                                className={errors.discountValue ? 'border-red-500' : ''}
                                placeholder={formData.discountType === 'PERCENT' ? '%' : 'VNĐ'}
                            />
                            {errors.discountValue && <p className="text-xs text-red-500">{errors.discountValue}</p>}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="minOrderValue">Giá trị đơn tối thiểu (VNĐ)</Label>
                        <Input
                            id="minOrderValue"
                            type="number"
                            value={formData.minOrderValue || ''}
                            onChange={(e) => updateField('minOrderValue', e.target.value ? Number(e.target.value) : null)}
                            placeholder="Để trống nếu không có điều kiện"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate">
                                Ngày bắt đầu <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => updateField('startDate', e.target.value)}
                                className={errors.startDate ? 'border-red-500' : ''}
                            />
                            {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">
                                Ngày kết thúc <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => updateField('endDate', e.target.value)}
                                className={errors.endDate ? 'border-red-500' : ''}
                            />
                            {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Huỷ
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="bg-orange-500 hover:bg-orange-600"
                    >
                        {isPending ? 'Đang tạo...' : 'Tạo voucher'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};