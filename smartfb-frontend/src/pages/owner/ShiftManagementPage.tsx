import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { shiftService } from '@modules/staff/services/shiftService';
import { branchService } from '@modules/branch/services/branchService';
import type { ShiftTemplate, ShiftSchedule } from '@modules/staff/types/shift.types';
import type { Branch } from '@modules/branch/types/branch.types';
import { useToast } from '@shared/hooks/useToast';

export default function ShiftManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [schedule, setSchedule] = useState<ShiftSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { error } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const branchRes = await branchService.getList();
        setBranches(branchRes.data || []);
        if (branchRes.data?.length > 0) {
          setSelectedBranch(branchRes.data[0].id);
        }
      } catch {
        error('Thất bại', 'Không thể tải danh sách chi nhánh');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tempRes, schedRes] = await Promise.all([
          shiftService.getTemplates(selectedBranch),
          shiftService.getSchedule({ 
            branchId: selectedBranch, 
            date: currentDate.toISOString().split('T')[0] 
          })
        ]);
        setTemplates(tempRes.data || []);
        setSchedule(schedRes.data || []);
      } catch {
        error('Thất bại', 'Không thể tải dữ liệu ca làm');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedBranch, currentDate]);

  const nextDay = () => setCurrentDate(prev => new Date(prev.getTime() + 86400000));
  const prevDay = () => setCurrentDate(prev => new Date(prev.getTime() - 86400000));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Ca làm việc</h1>
          <p className="text-gray-500">Thiết lập khung giờ và theo dõi lịch trực nhân viên</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4" />
            Tạo ca mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Khung giờ mẫu (Templates) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Khung giờ mẫu
          </h3>
          <div className="space-y-3">
            {templates.map(temp => (
              <div key={temp.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex justify-between items-center group hover:border-slate-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-10 rounded-full" style={{ backgroundColor: temp.color }} />
                  <div>
                    <div className="font-medium text-gray-900">{temp.name}</div>
                    <div className="text-xs text-gray-500">{temp.start_time} - {temp.end_time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                    <Users className="w-3 h-3" />
                    {temp.min_staff}-{temp.max_staff}
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && !isLoading && (
              <div className="py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                Chưa có khung giờ nào
              </div>
            )}
          </div>
        </div>

        {/* Lịch làm việc trong ngày (Schedule) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Lịch trực ngày {currentDate.toLocaleDateString('vi-VN')}
            </h3>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button onClick={prevDay} className="p-1 hover:bg-white rounded transition-all shadow-sm">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-medium">Hôm nay</span>
              <button onClick={nextDay} className="p-1 hover:bg-white rounded transition-all shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="py-20 flex justify-center"><div className="spinner" /></div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Nhân viên</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Ca trực</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Check-in/out</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schedule.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.staff_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.shift_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono italic">
                        {item.checked_in_at || '--:--'} | {item.checked_out_at || '--:--'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {schedule.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                        Chưa có lịch xếp cho ngày này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
