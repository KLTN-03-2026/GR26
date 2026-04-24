import type { ApiResponse } from '@shared/types/api.types';

export type ShiftStatus = 'scheduled' | 'completed' | 'absent' | 'cancelled';

export interface ShiftTemplate {
  id: string;
  branch_id: string;
  name: string;
  start_time: string;
  end_time: string;
  min_staff: number;
  max_staff: number;
  color: string;
  description?: string;
}

export interface ShiftSchedule {
  id: string;
  branch_id: string;
  staff_id: string;
  shift_template_id: string;
  date: string;
  status: ShiftStatus;
  checked_in_at?: string;
  checked_out_at?: string;
  staff_name?: string;
  shift_name?: string;
}

export type CreateShiftTemplatePayload = Omit<ShiftTemplate, 'id'>;
export type RegisterShiftPayload = {
  shift_template_id: string;
  date: string;
};
