import { Clock, Users, Palette, Power } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { LocalTime, ShiftTemplate } from '@modules/shift/types/shift.types';

interface ShiftTemplateInfoCardProps {
    template: ShiftTemplate;
    onEdit: () => void;
}

const formatTime = (time?: LocalTime | null): string => {
    if (typeof time?.hour !== 'number' || typeof time?.minute !== 'number') {
        return '--:--';
    }

    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
};

const getStatusBadgeClassName = (active: boolean) =>
    active ? 'badge-completed' : 'badge-warning';

const getStatusLabel = (active: boolean) =>
    active ? 'Đang hoạt động' : 'Ngưng hoạt động';

/**
 * Card hiển thị thông tin chi tiết ca mẫu
 */
export const ShiftTemplateInfoCard = ({ template, onEdit }: ShiftTemplateInfoCardProps) => {
    return (
        <div className="card space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Thông tin ca mẫu</h2>
                <Button
                    onClick={onEdit}
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                >
                    Chỉnh sửa
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tên ca */}
                <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-text-secondary mt-0.5" />
                    <div>
                        <p className="text-sm text-text-secondary">Tên ca</p>
                        <p className="font-medium text-text-primary">{template.name}</p>
                    </div>
                </div>

                {/* Giờ làm việc */}
                <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-text-secondary mt-0.5" />
                    <div>
                        <p className="text-sm text-text-secondary">Giờ làm việc</p>
                        <p className="font-medium text-text-primary">
                            {formatTime(template.startTime)} - {formatTime(template.endTime)}
                        </p>
                    </div>
                </div>

                {/* Số lượng nhân viên */}
                <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-text-secondary mt-0.5" />
                    <div>
                        <p className="text-sm text-text-secondary">Số lượng nhân viên</p>
                        <p className="font-medium text-text-primary">
                            Tối thiểu: {template.minStaff} | Tối đa: {template.maxStaff}
                        </p>
                    </div>
                </div>

                {/* Màu sắc */}
                <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-text-secondary mt-0.5" />
                    <div>
                        <p className="text-sm text-text-secondary">Màu sắc hiển thị</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: template.color }}
                            />
                            <span className="font-medium text-text-primary">{template.color}</span>
                        </div>
                    </div>
                </div>

                {/* Trạng thái */}
                <div className="flex items-start gap-3">
                    <Power className="h-5 w-5 text-text-secondary mt-0.5" />
                    <div>
                        <p className="text-sm text-text-secondary">Trạng thái</p>
                        <span className={`badge ${getStatusBadgeClassName(template.active)}`}>
                            {getStatusLabel(template.active)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
