import { useState } from 'react';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import type { Step2OperationsData, DayOfWeek, WorkingHours, WorkingSchedule } from '@modules/branch/types/branch.types';

interface Step2OperationsProps {
  data: Partial<Step2OperationsData>;
  onChange: (data: Partial<Step2OperationsData>) => void;
  errors?: any;
}

const daysOfWeek: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Thứ Hai' },
  { key: 'tuesday', label: 'Thứ Ba' },
  { key: 'wednesday', label: 'Thứ Tư' },
  { key: 'thursday', label: 'Thứ Năm' },
  { key: 'friday', label: 'Thứ Sáu' },
  { key: 'saturday', label: 'Thứ Bảy' },
  { key: 'sunday', label: 'Chủ Nhật' },
];

const integrationPlatforms = [
  { id: 'grabfood' as const, name: 'GrabFood', description: 'Đồng bộ đơn hàng tự động' },
  { id: 'shopeefood' as const, name: 'ShopeeFood', description: 'Quản lý gian hàng trực tuyến' },
];

// Helper: Convert 24h to 12h format
const convertTo12Hour = (time24: string): { hour: string; minute: string; period: 'AM' | 'PM' } => {
  const [hours, minutes] = time24.split(':');
  const hour24 = parseInt(hours);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return {
    hour: hour12.toString().padStart(2, '0'),
    minute: minutes,
    period,
  };
};

// Helper: Convert 12h to 24h format
const convertTo24Hour = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
  let hour24 = parseInt(hour);
  if (period === 'AM' && hour24 === 12) hour24 = 0;
  if (period === 'PM' && hour24 !== 12) hour24 += 12;
  return `${hour24.toString().padStart(2, '0')}:${minute}`;
};

/**
 * Step 2: Vận hành - Giờ hoạt động và tích hợp
 */
export const Step2Operations = ({ data, onChange }: Step2OperationsProps) => {
  const workingSchedule: Partial<WorkingSchedule> = data.workingSchedule || {};
  const integrations = data.integrations || { grabfood: false, shopeefood: false };
  const [syncEnabled, setSyncEnabled] = useState(false);

  const handleDayToggle = (day: DayOfWeek, enabled: boolean) => {
    const currentDay = workingSchedule[day] || { enabled: false, openTime: '07:00', closeTime: '22:30' };
    onChange({
      ...data,
      workingSchedule: {
        ...workingSchedule,
        [day]: { ...currentDay, enabled },
      } as WorkingSchedule,
    });
  };

  const handleTimeChange = (day: DayOfWeek, field: 'openTime' | 'closeTime', hour: string, minute: string, period: 'AM' | 'PM') => {
    const time24 = convertTo24Hour(hour, minute, period);
    const currentDay = workingSchedule[day] || { enabled: true, openTime: '07:00', closeTime: '22:30' };
    onChange({
      ...data,
      workingSchedule: {
        ...workingSchedule,
        [day]: { ...currentDay, [field]: time24 },
      } as WorkingSchedule,
    });
  };

  const handleSyncToggle = (enabled: boolean) => {
    setSyncEnabled(enabled);
    
    if (enabled) {
      const mondayData = workingSchedule.monday || { enabled: true, openTime: '07:00', closeTime: '22:30' };
      const newSchedule: Partial<WorkingSchedule> = { ...workingSchedule };
      
      for (const { key } of daysOfWeek) {
        if (key !== 'monday') {
          newSchedule[key] = { ...mondayData };
        }
      }
      
      onChange({
        ...data,
        workingSchedule: newSchedule as WorkingSchedule,
      });
    }
  };

  const handleIntegrationToggle = (platform: 'grabfood' | 'shopeefood', enabled: boolean) => {
    onChange({
      ...data,
      integrations: {
        ...integrations,
        [platform]: enabled,
      },
    });
  };

  return (
    <div className="space-y-4 px-1">
      {/* Giờ hoạt động */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">GIỜ HOẠT ĐỘNG</h3>
          <div className="flex items-center gap-2">
            <Switch checked={syncEnabled} onCheckedChange={handleSyncToggle} />
            <span className="text-xs text-gray-600">Đồng bộ giờ từ Thứ Hai</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[100px_1fr_1fr] gap-3 text-xs font-medium text-gray-600 px-2">
            <div>Ngày</div>
            <div>Mở cửa lúc</div>
            <div>Đóng cửa</div>
          </div>

          {/* Days */}
          {daysOfWeek.map(({ key, label }) => {
            const dayData: WorkingHours = workingSchedule[key] || { enabled: true, openTime: '07:00', closeTime: '22:30' };
            const isEnabled = dayData.enabled;
            const openTime = convertTo12Hour(dayData.openTime);
            const closeTime = convertTo12Hour(dayData.closeTime);

            return (
              <div
                key={key}
                className={`grid grid-cols-[100px_1fr_1fr] gap-3 items-center py-2 px-2 rounded-lg border ${
                  isEnabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleDayToggle(key, checked as boolean)}
                    disabled={syncEnabled && key !== 'monday'}
                  />
                  <Label className={`text-sm ${!isEnabled && 'text-gray-400'}`}>{label}</Label>
                </div>
                
                {/* Open Time */}
                <div className="flex gap-1">
                  <TimeSelect
                    type="hour"
                    value={openTime.hour}
                    onChange={(val) => handleTimeChange(key, 'openTime', val, openTime.minute, openTime.period)}
                    disabled={!isEnabled || (syncEnabled && key !== 'monday')}
                  />
                  <TimeSelect
                    type="minute"
                    value={openTime.minute}
                    onChange={(val) => handleTimeChange(key, 'openTime', openTime.hour, val, openTime.period)}
                    disabled={!isEnabled || (syncEnabled && key !== 'monday')}
                  />
                  <TimeSelect
                    type="period"
                    value={openTime.period}
                    onChange={(val) => handleTimeChange(key, 'openTime', openTime.hour, openTime.minute, val as 'AM' | 'PM')}
                    disabled={!isEnabled || (syncEnabled && key !== 'monday')}
                  />
                </div>

                {/* Close Time */}
                <div className="flex gap-1">
                  <TimeSelect
                    type="hour"
                    value={closeTime.hour}
                    onChange={(val) => handleTimeChange(key, 'closeTime', val, closeTime.minute, closeTime.period)}
                    disabled={!isEnabled || (syncEnabled && key !== 'monday')}
                  />
                  <TimeSelect
                    type="minute"
                    value={closeTime.minute}
                    onChange={(val) => handleTimeChange(key, 'closeTime', closeTime.hour, val, closeTime.period)}
                    disabled={!isEnabled || (syncEnabled && key !== 'monday')}
                  />
                  <TimeSelect
                    type="period"
                    value={closeTime.period}
                    onChange={(val) => handleTimeChange(key, 'closeTime', closeTime.hour, closeTime.minute, val as 'AM' | 'PM')}
                    disabled={!isEnabled || (syncEnabled && key !== 'monday')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cài đặt tích hợp */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">CÀI ĐẶT TÍCH HỢP</h3>
        <div className="space-y-2">
          {integrationPlatforms.map((platform) => {
            const isEnabled = integrations[platform.id];

            return (
              <div
                key={platform.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                      platform.id === 'grabfood' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {platform.id === 'grabfood' ? 'G' : 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{platform.name}</p>
                    <p className="text-xs text-gray-500">{platform.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleIntegrationToggle(platform.id, checked)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Component TimeSelect cho giờ, phút, AM/PM
const TimeSelect = ({ 
  type, 
  value, 
  onChange, 
  disabled 
}: { 
  type: 'hour' | 'minute' | 'period'; 
  value: string; 
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  let options: string[] = [];
  let placeholder = '';

  if (type === 'hour') {
    options = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    placeholder = '07';
  } else if (type === 'minute') {
    options = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    placeholder = '00';
  } else {
    options = ['AM', 'PM'];
    placeholder = 'AM';
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`h-8 text-xs ${type === 'period' ? 'w-16' : 'w-14'}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option} className="text-xs">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
