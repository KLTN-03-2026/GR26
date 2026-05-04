import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, CircleCheckBig, CircleOff } from 'lucide-react';
import { ShiftTemplateFilterBar } from '@modules/shift/components/ShiftTemplateFilterBar/ShiftTemplateFilterBar';
import { ShiftTemplateTable } from '@modules/shift/components/ShiftTemplateTable/ShiftTemplateTable';
import { ShiftTemplateFormModal } from '@modules/shift/components/ShiftTemplateFormModal';
import { OwnerShiftSchedulePanel } from '@modules/shift/components/OwnerShiftSchedulePanel';
import { useShiftTemplateFilters } from '@modules/shift/hooks/useShiftFilters';
import { useShiftTemplates } from '@modules/shift/hooks/useShiftTemplates';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';
import type { ShiftTemplate } from '@modules/shift/types/shift.types';

interface StatCardProps {
    icon: ReactNode;
    iconBg: string;
    label: string;
    value: string;
    valueColor?: string;
}

const StatCard = ({ icon, iconBg, label, value, valueColor = 'text-text-primary' }: StatCardProps) => (
    <div className="card">
        <div className="mb-1 flex items-center gap-2 text-sm text-text-secondary">
            <div className={`flex h-10 w-10 items-center justify-center rounded-card ${iconBg}`}>
                {icon}
            </div>
            <span className="font-medium text-text-primary">{label}</span>
        </div>
        <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </div>
);

/**
 * Page quản lý ca mẫu (Shift Templates)
 * Được gọi từ route ROUTES.OWNER.SCHEDULES
 * Giao diện đồng bộ với BranchesPage
 */
export default function ShiftManagementPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { templates, isLoading, error, deleteTemplate } = useShiftTemplates();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
    const isCreateRoute = location.pathname === ROUTES.OWNER.SHIFT_TEMPLATE_NEW;
    const isTemplateModalOpen = isCreateRoute || modalOpen;

    const {
        filters,
        pagination,
        templates: filteredTemplates,
        totalItems,
        hasActiveFilters,
        updateFilter,
        clearFilters,
        updatePage,
        totalPages,
    } = useShiftTemplateFilters(templates);

    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.active === true).length;
    const inactiveTemplates = templates.filter(t => t.active === false).length;

    const handleAddTemplate = () => {
        setEditingTemplate(null);
        navigate(ROUTES.OWNER.SHIFT_TEMPLATE_NEW);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingTemplate(null);
        // Nếu đang ở route /new, quay lại danh sách
        if (location.pathname === ROUTES.OWNER.SHIFT_TEMPLATE_NEW) {
            navigate(ROUTES.OWNER.SCHEDULES);
        }
    };

    const handleEdit = (template: ShiftTemplate) => {
        setEditingTemplate(template);
        setModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="spinner spinner-md" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <p className="mb-4 font-medium text-red-600">Không thể tải danh sách ca mẫu</p>
                <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Stats Card*/}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    icon={<Clock className="h-5 w-5 text-primary" />}
                    iconBg="bg-primary-light"
                    label="Tổng ca mẫu"
                    value={String(totalTemplates).padStart(2, '0')}
                />
                <StatCard
                    icon={<CircleCheckBig className="h-5 w-5 text-success-text" />}
                    iconBg="bg-success-light"
                    label="Đang hoạt động"
                    value={String(activeTemplates).padStart(2, '0')}
                    valueColor="text-success-text"
                />
                <StatCard
                    icon={<CircleOff className="h-5 w-5 text-warning-text" />}
                    iconBg="bg-warning-light"
                    label="Ngưng hoạt động"
                    value={String(inactiveTemplates).padStart(2, '0')}
                    valueColor="text-warning-text"
                />
            </div>

            <OwnerShiftSchedulePanel templates={templates} isTemplatesLoading={isLoading} />

            {/* Filter Bar & Table */}
            <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">Ca mẫu</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                        Thiết lập khung giờ làm việc dùng để xếp lịch cho nhân viên.
                    </p>
                </div>

                <ShiftTemplateFilterBar
                    filters={filters}
                    onSearchChange={(value) => updateFilter('search', value)}
                    onStatusChange={(value) => updateFilter('active', value)}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                    onAddTemplate={handleAddTemplate}
                />

                <ShiftTemplateTable
                    templates={filteredTemplates}
                    currentPage={pagination.page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={updatePage}
                    onDelete={deleteTemplate}
                    onEdit={handleEdit}
                    isLoading={isLoading}
                />
            </div>

            {/* Modal Create/Edit */}
            <ShiftTemplateFormModal
                key={editingTemplate?.id ?? (isCreateRoute ? 'create-template' : 'closed-template')}
                open={isTemplateModalOpen}
                onOpenChange={handleModalClose}
                editingTemplate={isCreateRoute ? null : editingTemplate}
            />
        </div>
    );
}
