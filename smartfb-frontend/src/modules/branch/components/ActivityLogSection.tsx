import { Clock, Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import type { ActivityLog, ActivityActionType } from '../types/branch.types';

interface ActivityLogSectionProps {
  logs: ActivityLog[];
  isLoading?: boolean;
}

const actionConfig: Record<ActivityActionType, { icon: typeof Plus; color: string; label: string }> = {
  create: { icon: Plus, color: 'text-green-600', label: 'Tạo mới' },
  update: { icon: Pencil, color: 'text-blue-600', label: 'Cập nhật' },
  delete: { icon: Trash2, color: 'text-red-600', label: 'Xóa' },
  activate: { icon: Power, color: 'text-green-600', label: 'Kích hoạt' },
  deactivate: { icon: PowerOff, color: 'text-orange-600', label: 'Tạm ngưng' },
};

/**
 * Component hiển thị lịch sử hoạt động chi nhánh
 */
export const ActivityLogSection = ({ logs, isLoading = false }: ActivityLogSectionProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử hoạt động</h2>
        <div className="flex justify-center items-center h-32">
          <div className="spinner spinner-md" />
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử hoạt động</h2>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có hoạt động nào</p>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử hoạt động</h2>
      
      <div className="space-y-4">
        {logs.map((log) => {
          const config = actionConfig[log.action];
          const Icon = config.icon;

          return (
            <div key={log.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {log.userName}
                      <span className={`ml-2 text-xs font-normal ${config.color}`}>
                        {config.label}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {log.description}
                    </p>
                    {log.branchName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Chi nhánh: <span className="font-medium">{log.branchName}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
