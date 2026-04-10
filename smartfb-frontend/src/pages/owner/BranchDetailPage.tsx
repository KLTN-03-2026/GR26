import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditBranchDialog } from '@modules/branch/components/EditBranchDialog';
import { BranchInfoCard } from '@modules/branch/components/branch-detail';
import { useBranchDetail } from '@modules/branch/hooks/useBranchDetail';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';

/**
 * Page hiển thị chi tiết chi nhánh.
 * URL: /owner/branches/:id
 */
export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { data: branch, isLoading, isError } = useBranchDetail(id || '');

  if (!id) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-secondary">Không tìm thấy ID chi nhánh</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 font-medium text-red-600">Không tìm thấy chi nhánh</p>
        <Button onClick={() => navigate(ROUTES.OWNER.BRANCHES)}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  if (isLoading || !branch) {
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
          onClick={() => navigate(ROUTES.OWNER.BRANCHES)}
          className="flex items-center gap-1 hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-text-primary">{branch.name}</span>
      </div>

      <BranchInfoCard branch={branch} onEdit={() => setIsEditDialogOpen(true)} />

      {isEditDialogOpen && (
        <EditBranchDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          branch={branch}
        />
      )}
    </div>
  );
}
