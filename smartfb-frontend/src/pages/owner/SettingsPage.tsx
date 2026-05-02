import { Settings, User, KeyRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { ProfileTab } from '@modules/account/components/ProfileTab';
import { ChangePasswordTab } from '@modules/account/components/ChangePasswordTab';

/**
 * Trang cài đặt cá nhân.
 * Hiện tại gồm 2 tab: Thông tin cá nhân và Đổi mật khẩu.
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-card bg-primary-light">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Cài đặt</h1>
          <p className="text-sm text-text-secondary">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>
      </div>

      {/* Tabs content */}
      <div className="rounded-card border border-border bg-card p-6 shadow-card">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-4 w-4" />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-1.5">
              <KeyRound className="h-4 w-4" />
              Đổi mật khẩu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="password">
            <ChangePasswordTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
