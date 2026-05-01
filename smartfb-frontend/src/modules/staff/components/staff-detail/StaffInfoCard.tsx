import {
  Building2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  UserCircle,
  Edit,
  Fingerprint,
  Briefcase,
  Cake,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { StaffDetail } from '../../types/staff.types';

interface StaffInfoCardProps {
  staff: StaffDetail;
  onEdit: () => void;
}

export const StaffInfoCard = ({ staff, onEdit }: StaffInfoCardProps) => {
  // Map gender sang tiếng Việt
  const getGenderDisplay = (gender?: string) => {
    switch (gender) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      case 'OTHER': return 'Khác';
      default: return '---';
    }
  };

  // Map roles to display
  const getRolesDisplay = (roles?: { id: string; name: string }[]) => {
    if (!roles || roles.length === 0) return '---';
    return roles.map(r => r.name).join(', ');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            {staff.avatarUrl ? (
              <img src={staff.avatarUrl} alt={staff.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircle className="w-12 h-12 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{staff.fullName}</h2>
            <p className="text-gray-500 mt-1">{staff.positionName || 'Chưa phân công'}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`badge ${staff.status === 'ACTIVE' ? 'badge-completed' : 'badge-warning'}`}>
                {staff.status === 'ACTIVE' ? 'Đang làm' : 'Đã nghỉ'}
              </span>
              {staff.gender && (
                <span className="badge badge-info">{getGenderDisplay(staff.gender)}</span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <InfoItem icon={Phone} label="Số điện thoại" value={staff.phone} />
        <InfoItem icon={Mail} label="Email" value={staff.email || '---'} />
        <InfoItem icon={Fingerprint} label="Mã nhân viên" value={staff.employeeCode || '---'} />
        <InfoItem icon={Cake} label="Ngày sinh" value={staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString('vi-VN') : '---'} />
        <InfoItem icon={Building2} label="Vị trí" value={staff.positionName || 'Chưa phân công'} />
        <InfoItem icon={Calendar} label="Ngày vào làm" value={staff.hireDate ? new Date(staff.hireDate).toLocaleDateString('vi-VN') : '---'} />
        <InfoItem icon={MapPin} label="Địa chỉ" value={staff.address || '---'} />
        <InfoItem icon={Briefcase} label="Vai trò" value={getRolesDisplay(staff.roles)} />
      </div>
    </div>
  );
};

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">{value || '---'}</p>
    </div>
  </div>
);
