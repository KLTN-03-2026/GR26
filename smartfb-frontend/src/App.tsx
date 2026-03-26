import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { OwnerLayout } from '@shared/components/layout/Layout';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';
import { mockBranches } from '@/data';
import BranchesPage from '@pages/owner/BranchesPage';

// Placeholder pages - will be created later
const DashboardPage = () => <div className="p-4">Dashboard Page</div>;
const TablesPage = () => <div className="p-4">Tables Page</div>;
const OrdersPage = () => <div className="p-4">Orders Page</div>;
const RevenuePage = () => <div className="p-4">Revenue Page</div>;
const MenuPage = () => <div className="p-4">Menu Page</div>;
const InventoryPage = () => <div className="p-4">Inventory Page</div>;
const RecipesPage = () => <div className="p-4">Recipes Page</div>;
const StaffPage = () => <div className="p-4">Staff Management Page</div>;
const SchedulesPage = () => <div className="p-4">Schedules Page</div>;
const PromotionsPage = () => <div className="p-4">Promotions Page</div>;
const SuppliersPage = () => <div className="p-4">Suppliers Page</div>;
const ReportsPage = () => <div className="p-4">Reports Page</div>;
const SettingsPage = () => <div className="p-4">Settings Page</div>;
const PackagesPage = () => <div className="p-4">Packages Page</div>;

interface OwnerRouteConfig {
  path: string;
  element: React.ReactNode;
  pageTitle: string;
}

/**
 * Main App component with routing and layout
 */
function App() {
  const { isOwner } = usePermission();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // TODO: Replace with actual auth check
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  const ownerRoutes: OwnerRouteConfig[] = [
    { path: ROUTES.OWNER.DASHBOARD, element: <DashboardPage />, pageTitle: 'Dashboard' },
    { path: ROUTES.OWNER.TABLES, element: <TablesPage />, pageTitle: 'Quản lý bàn' },
    { path: ROUTES.OWNER.ORDERS, element: <OrdersPage />, pageTitle: 'Quản lý đơn hàng' },
    { path: ROUTES.OWNER.REVENUE, element: <RevenuePage />, pageTitle: 'Báo cáo doanh thu' },
    { path: ROUTES.OWNER.MENU, element: <MenuPage />, pageTitle: 'Quản lý thực đơn' },
    { path: ROUTES.OWNER.INVENTORY, element: <InventoryPage />, pageTitle: 'Quản lý kho' },
    { path: ROUTES.OWNER.RECIPES, element: <RecipesPage />, pageTitle: 'Công thức' },
    { path: ROUTES.OWNER.STAFF, element: <StaffPage />, pageTitle: 'Quản lý nhân viên' },
    { path: ROUTES.OWNER.SCHEDULES, element: <SchedulesPage />, pageTitle: 'Lịch làm việc' },
    { path: ROUTES.OWNER.BRANCHES, element: <BranchesPage />, pageTitle: 'Quản lý chi nhánh' },
    { path: ROUTES.OWNER.PROMOTIONS, element: <PromotionsPage />, pageTitle: 'Khuyến mãi' },
    { path: ROUTES.OWNER.SUPPLIERS, element: <SuppliersPage />, pageTitle: 'Nhà cung cấp' },
    { path: ROUTES.OWNER.REPORTS, element: <ReportsPage />, pageTitle: 'Báo cáo' },
    { path: ROUTES.OWNER.SETTINGS, element: <SettingsPage />, pageTitle: 'Cài đặt' },
    { path: ROUTES.OWNER.PACKAGES, element: <PackagesPage />, pageTitle: 'Gói dịch vụ' },
  ];

  return (
    <Routes>
      {/* Owner Routes */}
      {isOwner && ownerRoutes.map(({ path, element, pageTitle }) => (
        <Route
          key={path}
          path={path}
          element={
            <OwnerLayout
              pageTitle={pageTitle}
              branches={mockBranches}
              selectedBranchId={selectedBranchId}
              onBranchChange={handleBranchChange}
            >
              {element}
            </OwnerLayout>
          }
        />
      ))}

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={ROUTES.OWNER.DASHBOARD} replace />} />
    </Routes>
  );
}

export default App;
