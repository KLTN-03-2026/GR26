import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/useToast';
import { shiftService } from '@modules/staff/services/shiftService';
import type { ShiftTemplate } from '@modules/staff/types/shift.types';

/**
 * Trang Đăng ký ca làm (Dành cho nhân viên)
 * Đáp ứng Module 4 US-11: Nhân viên đăng ký ca làm
 */
export default function ShiftRegistrationPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [selectedShift, setSelectedShift] = useState<string | null>(null);

  // Lấy danh sách ca làm trống (mẫu ca làm)
  const { data: response, isLoading } = useQuery({
    queryKey: ['shifts', 'templates'],
    queryFn: () => shiftService.getTemplates(),
  });

  const templates = response?.data || [];

  // Mutation đăng ký ca làm
  const registerMutation = useMutation({
    mutationFn: (templateId: string) => 
      shiftService.register({ 
        shift_template_id: templateId, 
        date: new Date().toISOString().split('T')[0] // Use current date for now
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', 'my-registrations'] });
      success('Đăng ký thành công', 'Yêu cầu đăng ký ca làm của bạn đã được gửi và đang chờ duyệt.');
      setSelectedShift(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Không thể đăng ký ca làm lúc này.';
      error('Đăng ký thất bại', message);
    }
  });

  const handleRegister = (templateId: string) => {
    setSelectedShift(templateId);
    registerMutation.mutate(templateId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="spinner spinner-lg" />
        <p className="text-gray-500">Đang tải danh sách ca làm trống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đăng ký ca làm</h1>
        <p className="text-gray-500 text-sm">Chọn các ca làm trống phù hợp với lịch trình của bạn</p>
      </div>

      {templates.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-12 h-12 text-blue-400 opacity-50" />
          <h3 className="text-blue-900 font-semibold">Hiện không có ca làm trống</h3>
          <p className="text-blue-700 text-sm max-w-md">
            Tất cả các ca làm hiện đã có nhân viên phụ trách hoặc chưa có kế hoạch mới. 
            Vui lòng quay lại sau hoặc liên hệ quản lý.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((shift: ShiftTemplate) => (
            <div 
              key={shift.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-blue-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                {/* Weekly/Daily indicator */}
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  Lặp lại hàng tuần
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{shift.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                <Clock className="w-4 h-4" />
                <span>{shift.start_time} - {shift.end_time}</span>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs text-gray-500 line-clamp-2 italic">
                  "{shift.description || 'Không có mô tả chi tiết'}"
                </p>
              </div>

              <Button 
                onClick={() => handleRegister(shift.id)}
                disabled={registerMutation.isPending && selectedShift === shift.id}
                className="w-full rounded-xl flex items-center justify-center gap-2"
              >
                {registerMutation.isPending && selectedShift === shift.id ? (
                  <div className="spinner spinner-xs border-white" />
                ) : (
                  <>
                    Đăng ký ngay
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Thông tin hỗ trợ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-4">
        <div className="bg-amber-50 rounded-full p-2">
          <CheckCircle2 className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Lưu ý khi đăng ký ca làm</h4>
          <ul className="text-sm text-gray-600 mt-1 list-disc list-inside space-y-1">
            <li>Sau khi đăng ký, quản lý sẽ phê duyệt yêu cầu của bạn.</li>
            <li>Bạn có thể xem trạng thái đăng ký tại mục "Ca làm của tôi".</li>
            <li>Vui lòng đăng ký trước ít nhất 24 giờ so với thời điểm ca làm bắt đầu.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
