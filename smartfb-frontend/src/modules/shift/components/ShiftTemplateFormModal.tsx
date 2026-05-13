import { type KeyboardEvent, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { NumericInput } from '@shared/components/common/NumericInput';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@shared/components/ui/select';
import { useShiftTemplates } from '../hooks/useShiftTemplates';
import type { LocalTime, ShiftTemplate, CreateShiftTemplatePayload } from '../types/shift.types';

interface ShiftTemplateFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingTemplate?: ShiftTemplate | null;
    onSuccess?: () => void;
}

interface ShiftTimeSelectProps {
    id: string;
    value: string;
    hasError?: boolean;
    onValueChange: (value: string) => void;
}

// Giờ mặc định khi owner tạo ca mẫu mới.
const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '17:00';

// Khoảng cách giữa các mốc giờ làm việc để lịch ca không bị nhập lẻ phút.
const SHIFT_TIME_STEP_MINUTES = 30;

// Danh sách giờ hiển thị theo chuẩn Việt Nam 24h `HH:mm`.
const SHIFT_TIME_OPTIONS = Array.from({ length: (24 * 60) / SHIFT_TIME_STEP_MINUTES }, (_, index) => {
    const totalMinutes = index * SHIFT_TIME_STEP_MINUTES;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const ShiftTimeSelect = ({ id, value, hasError = false, onValueChange }: ShiftTimeSelectProps) => (
    <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className={hasError ? 'border-red-500' : ''}>
            <SelectValue placeholder="Chọn giờ" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
            {SHIFT_TIME_OPTIONS.map((time) => (
                <SelectItem key={time} value={time}>
                    {time}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

const formatTimeForInput = (time: LocalTime | null | undefined, fallback: string): string => {
    if (typeof time?.hour !== 'number' || typeof time?.minute !== 'number') {
        return fallback;
    }

    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
};

const parseTimeFromInput = (time: string): string => {
    return `${time}:00`;
};

const getInitialFormData = (editingTemplate?: ShiftTemplate | null) => {
    if (!editingTemplate) {
        return {
            name: '',
            startTime: DEFAULT_START_TIME,
            endTime: DEFAULT_END_TIME,
            minStaff: 1,
            maxStaff: 5,
            color: '#1890ff',
            active: true,
        };
    }

    return {
        name: editingTemplate.name,
        startTime: formatTimeForInput(editingTemplate.startTime, DEFAULT_START_TIME),
        endTime: formatTimeForInput(editingTemplate.endTime, DEFAULT_END_TIME),
        minStaff: editingTemplate.minStaff,
        maxStaff: editingTemplate.maxStaff,
        color: editingTemplate.color,
        active: editingTemplate.active,
    };
};

/**
 * Dialog tạo/sửa ca mẫu
 */
export const ShiftTemplateFormModal = ({
    open,
    onOpenChange,
    editingTemplate,
    onSuccess,
}: ShiftTemplateFormModalProps) => {
    const { createTemplate, updateTemplate, isCreating, isUpdating } = useShiftTemplates();
    const isEditing = !!editingTemplate;
    const isPending = isCreating || isUpdating;

    const [formData, setFormData] = useState(() => getInitialFormData(editingTemplate));

    const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

    const validate = (): boolean => {
        const nextErrors: Partial<Record<keyof typeof formData, string>> = {};

        if (!formData.name.trim()) {
            nextErrors.name = 'Tên ca không được để trống';
        } else if (formData.name.trim().length > 100) {
            nextErrors.name = 'Tên ca không vượt quá 100 ký tự';
        }

        if (formData.minStaff < 1) {
            nextErrors.minStaff = 'Số lượng tối thiểu phải lớn hơn 0';
        }

        if (formData.maxStaff < formData.minStaff) {
            nextErrors.maxStaff = 'Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu';
        }

        // Validate giờ kết thúc phải sau giờ bắt đầu (so sánh string "HH:MM")
        if (formData.startTime >= formData.endTime) {
            nextErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) {
            return;
        }

        // Tạo payload với startTime và endTime là string format "HH:MM:SS"
        const payload: CreateShiftTemplatePayload = {
            name: formData.name.trim(),
            startTime: parseTimeFromInput(formData.startTime),
            endTime: parseTimeFromInput(formData.endTime),
            minStaff: formData.minStaff,
            maxStaff: formData.maxStaff,
            color: formData.color,
            active: formData.active,
        };

        if (isEditing && editingTemplate) {
            updateTemplate(
                { id: editingTemplate.id, payload },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                        onSuccess?.();
                    },
                }
            );
        } else {
            createTemplate(payload, {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess?.();
                },
            });
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
                        {isEditing ? 'Chỉnh sửa ca mẫu' : 'Thêm ca mẫu mới'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4" onKeyDown={handleKeyDown}>
                    {/* Tên ca */}
                    <div className="grid gap-2">
                        <Label htmlFor="shift-name">
                            Tên ca <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="shift-name"
                            value={formData.name}
                            onChange={(event) =>
                                setFormData({ ...formData, name: event.target.value })
                            }
                            className={errors.name ? 'border-red-500' : ''}
                            placeholder="VD: Ca sáng"
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Giờ bắt đầu và kết thúc */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="shift-start-time">
                                Giờ bắt đầu <span className="text-red-500">*</span>
                            </Label>
                            <ShiftTimeSelect
                                id="shift-start-time"
                                value={formData.startTime}
                                onValueChange={(startTime) => setFormData({ ...formData, startTime })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shift-end-time">
                                Giờ kết thúc <span className="text-red-500">*</span>
                            </Label>
                            <ShiftTimeSelect
                                id="shift-end-time"
                                value={formData.endTime}
                                hasError={Boolean(errors.endTime)}
                                onValueChange={(endTime) => setFormData({ ...formData, endTime })}
                            />
                            {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
                        </div>
                    </div>

                    {/* Số lượng nhân viên */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="shift-min-staff">Số lượng tối thiểu</Label>
                            <NumericInput
                                id="shift-min-staff"
                                min={1}
                                value={formData.minStaff}
                                onValueChange={(value) => setFormData({ ...formData, minStaff: value || 1 })}
                                className={errors.minStaff ? 'border-red-500' : ''}
                            />
                            {errors.minStaff && <p className="text-xs text-red-500">{errors.minStaff}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shift-max-staff">Số lượng tối đa</Label>
                            <NumericInput
                                id="shift-max-staff"
                                min={formData.minStaff}
                                value={formData.maxStaff}
                                onValueChange={(value) => setFormData({ ...formData, maxStaff: value || 1 })}
                                className={errors.maxStaff ? 'border-red-500' : ''}
                            />
                            {errors.maxStaff && <p className="text-xs text-red-500">{errors.maxStaff}</p>}
                        </div>
                    </div>

                    {/* Màu sắc */}
                    <div className="grid gap-2">
                        <Label htmlFor="shift-color">Màu sắc hiển thị</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="shift-color"
                                type="color"
                                value={formData.color}
                                onChange={(event) =>
                                    setFormData({ ...formData, color: event.target.value })
                                }
                                className="w-16 h-10 p-1"
                            />
                            <span className="text-sm text-gray-500">{formData.color}</span>
                        </div>
                    </div>

                    {/* Trạng thái hoạt động */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="shift-active"
                            checked={formData.active}
                            onChange={(event) =>
                                setFormData({ ...formData, active: event.target.checked })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <Label htmlFor="shift-active" className="cursor-pointer">
                            Hoạt động
                        </Label>
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
                        {isPending ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm ca mẫu'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
