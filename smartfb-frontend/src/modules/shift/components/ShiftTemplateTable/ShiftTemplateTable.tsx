import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@shared/components/ui/table';
import type { ShiftTemplate } from '@modules/shift/types/shift.types';
import { ShiftTemplateRow } from './ShiftTemplateRow';
import { ShiftTemplateTablePagination } from './ShiftTemplateTablePagination';

interface ShiftTemplateTableProps {
    templates: ShiftTemplate[];
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    onPageChange: (page: number) => void;
    onDelete: (id: string) => void;
    onEdit: (template: ShiftTemplate) => void;
    isLoading?: boolean;
}

/**
 * Table hiển thị danh sách ca mẫu dùng shadcn/ui
 */
export const ShiftTemplateTable = ({
    templates,
    currentPage,
    totalPages,
    totalItems = 0,
    onPageChange,
    onDelete,
    onEdit,
    isLoading = false,
}: ShiftTemplateTableProps) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="spinner spinner-md" />
            </div>
        );
    }

    if (templates.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-text-secondary">Không tìm thấy ca mẫu nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-lg">
                <Table>
                    <TableHeader className="border-0">
                        <TableRow className="hover:bg-cream border-b-0">
                            <TableHead>TÊN CA</TableHead>
                            <TableHead>GIỜ BẮT ĐẦU</TableHead>
                            <TableHead>GIỜ KẾT THÚC</TableHead>
                            <TableHead>SỐ LƯỢNG NHÂN VIÊN</TableHead>
                            <TableHead>MÀU SẮC</TableHead>
                            <TableHead>TRẠNG THÁI</TableHead>
                            <TableHead className="text-right">HÀNH ĐỘNG</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates.map((template) => (
                            <ShiftTemplateRow
                                key={template.id}
                                template={template}
                                onDelete={onDelete}
                                onEdit={onEdit}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ShiftTemplateTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={onPageChange}
            />
        </div>
    );
};