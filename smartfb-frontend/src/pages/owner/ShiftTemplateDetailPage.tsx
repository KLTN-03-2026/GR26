import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useShiftTemplates } from '@modules/shift/hooks/useShiftTemplates';
import { useShiftSchedules } from '@modules/shift/hooks/useShiftSchedules';
import { ShiftTemplateInfoCard } from '@modules/shift/components/ShiftTemplateDetail';
import { ShiftScheduleSection } from '@modules/shift/components/ShiftTemplateDetail';
import { ShiftTemplateFormModal } from '@modules/shift/components/ShiftTemplateFormModal';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';

/**
 * Page hiển thị chi tiết ca mẫu
 * URL: /owner/shift/templates/:id
 */
export default function ShiftTemplateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const { templates, isLoading: isTemplateLoading } = useShiftTemplates();
    const { useBranchSchedule } = useShiftSchedules();

    // Lấy ngày hiện tại và 30 ngày tới
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const { data: schedules = [], isLoading: isSchedulesLoading } = useBranchSchedule(today, nextMonthStr);

    const template = templates.find(t => t.id === id);

    // Filter schedules theo template id
    const templateSchedules = schedules.filter(s => s.shiftTemplateId === id);

    if (!id) {
        return (
            <div className="py-12 text-center">
                <p className="text-text-secondary">Không tìm thấy ID ca mẫu</p>
            </div>
        );
    }

    if (!template && !isTemplateLoading) {
        return (
            <div className="py-12 text-center">
                <p className="mb-4 font-medium text-red-600">Không tìm thấy ca mẫu</p>
                <Button onClick={() => navigate(ROUTES.OWNER.SCHEDULES)}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    if (isTemplateLoading || !template) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="spinner spinner-md" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
                <button
                    onClick={() => navigate(ROUTES.OWNER.SCHEDULES)}
                    className="flex items-center gap-1 hover:text-text-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </button>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-text-primary">{template.name}</span>
            </div>

            <ShiftTemplateInfoCard
                template={template}
                onEdit={() => setIsEditDialogOpen(true)}
            />

            <ShiftScheduleSection
                schedules={templateSchedules}
                isLoading={isSchedulesLoading}
            />

            {isEditDialogOpen && (
                <ShiftTemplateFormModal
                    key={template.id}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    editingTemplate={template}
                    onSuccess={() => {
                        // Refresh data after edit
                        setIsEditDialogOpen(false);
                    }}
                />
            )}
        </div>
    );
}
