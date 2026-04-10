import {
  Clock,
  Briefcase,
  AlertTriangle,
  FileText,
  Fingerprint,
} from "lucide-react";

// Định nghĩa type tạm thời (sau sẽ thay bằng API thật)
export type ActivityLogType =
  | 'attendance'
  | 'role_change'
  | 'shift_update'
  | 'document'
  | 'leave'
  | 'system';

export interface StaffActivityLog {
  id: string;
  type: ActivityLogType;
  title: string;
  timestamp: string;
  actor: {
    name: string;
    type: 'user' | 'system';
    avatar?: string;
  };
  metadata?: Record<string, string | number>;
}

interface ActivityLogSectionProps {
  logs: StaffActivityLog[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

const actionConfig: Record<
  ActivityLogType,
  {
    icon: typeof Fingerprint;
    color: string;
    bgColor: string;
  }
> = {
  attendance: { icon: Fingerprint, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  role_change: {
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  shift_update: {
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  document: {
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  leave: { icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-50" },
  system: { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50" },
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Section hiển thị lịch sử hoạt động nhân viên
 */
export const ActivityLogSection = ({
  logs,
  isLoading = false,
  onViewAll,
}: ActivityLogSectionProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Hoạt động gần đây
          </h2>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="spinner spinner-md" />
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Hoạt động gần đây
          </h2>
        </div>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có hoạt động nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Hoạt động gần đây
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Xem tất cả
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {logs.map((log) => {
          const config = actionConfig[log.type];
          const Icon = config.icon;

          return (
            <div
              key={log.id}
              className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center ${config.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {log.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        Bởi {log.actor.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};