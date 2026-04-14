import type { ApiResponse } from '@shared/types/api.types';

export interface Position {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  base_salary: number;
}

export type CreatePositionPayload = Omit<Position, 'id' | 'tenant_id'>;
export type UpdatePositionPayload = Partial<CreatePositionPayload>;
