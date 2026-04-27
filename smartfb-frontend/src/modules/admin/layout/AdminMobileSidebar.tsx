import { AdminSidebar } from './AdminSidebar';

interface AdminMobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-over sidebar cho admin trên mobile/tablet.
 */
export const AdminMobileSidebar = ({ open, onClose }: AdminMobileSidebarProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-admin-gray-900/50"
        aria-label="Đóng menu admin"
        onClick={onClose}
      />
      <div className="relative h-full w-admin-sidebar max-w-[86vw] shadow-xl">
        <AdminSidebar onNavigate={onClose} />
      </div>
    </div>
  );
};
