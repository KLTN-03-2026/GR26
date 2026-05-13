import { AdminPageHeader } from '@modules/admin/components/AdminPageHeader';
import { ProfileTab } from '@modules/account/components/ProfileTab';
import { UserCog } from 'lucide-react';

const AdminSettingsPage = () => {
  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Tài khoản admin"
        title="Cài đặt cá nhân"
        description="Cập nhật họ tên và số điện thoại của tài khoản admin đang đăng nhập."
      />

      <div className="rounded-lg border border-admin-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-admin-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-admin-brand-50 text-admin-brand-600">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-admin-gray-900">
              Thông tin cá nhân
            </h3>
            <p className="text-sm text-admin-gray-500">
              Email chỉ dùng để đăng nhập và không thay đổi tại màn hình này.
            </p>
          </div>
        </div>

        <ProfileTab />
      </div>
    </section>
  );
};

export default AdminSettingsPage;
