import { Button } from '@shared/components/ui/button';

interface MenuManagementErrorStateProps {
  onRetry: () => void;
}

/**
 * State lỗi chung cho màn quản lý thực đơn khi request danh sách món thất bại.
 */
export const MenuManagementErrorState = ({ onRetry }: MenuManagementErrorStateProps) => {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <p className="font-medium text-red-600">Có lỗi xảy ra khi tải thực đơn</p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    </div>
  );
};
