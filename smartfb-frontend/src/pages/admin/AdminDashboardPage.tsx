import { AdminEmptyState } from '@modules/admin/components/AdminEmptyState';
import { AdminErrorState } from '@modules/admin/components/AdminErrorState';
import { AdminLoadingState } from '@modules/admin/components/AdminLoadingState';
import { AdminOverviewGrid } from '@modules/admin/dashboard/components/AdminOverviewGrid';
import { useAdminDashboard } from '@modules/admin/dashboard/hooks/useAdminDashboard';

const AdminDashboardPage = () => {
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminDashboard();

  const handleRetry = () => {
    void refetch();
  };

  if (isLoading) {
    return (
      <AdminLoadingState
        title="Đang tải dashboard admin"
        description="Hệ thống đang tổng hợp tenant, gói dịch vụ và hóa đơn cần xử lý."
        className="min-h-[360px]"
      />
    );
  }

  if (isError || !overview) {
    return (
      <AdminErrorState
        title="Không thể tải dashboard admin"
        description="Vui lòng kiểm tra phiên đăng nhập admin hoặc trạng thái backend rồi thử lại."
        actionLabel="Tải lại dữ liệu"
        className="min-h-[360px]"
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  if (!overview.hasAnyData) {
    return (
      <AdminEmptyState
        eyebrow="Chưa có dữ liệu SaaS"
        title="Dashboard admin đang chờ dữ liệu đầu tiên"
        description="Khi hệ thống có tenant, gói dịch vụ hoặc hóa đơn subscription, các chỉ số tổng quan sẽ hiển thị tại đây."
      />
    );
  }

  return <AdminOverviewGrid overview={overview} />;
};

export default AdminDashboardPage;
