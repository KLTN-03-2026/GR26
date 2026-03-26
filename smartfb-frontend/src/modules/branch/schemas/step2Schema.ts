import { z } from 'zod';

/**
 * Zod schema validation cho Step 2: Vận hành
 */
const workingHoursSchema = z.object({
  enabled: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
}).refine(
  (data) => {
    if (!data.enabled) return true;
    return data.openTime < data.closeTime;
  },
  {
    message: 'Giờ mở cửa phải trước giờ đóng cửa',
  }
);

export const step2Schema = z.object({
  workingSchedule: z.object({
    monday: workingHoursSchema,
    tuesday: workingHoursSchema,
    wednesday: workingHoursSchema,
    thursday: workingHoursSchema,
    friday: workingHoursSchema,
    saturday: workingHoursSchema,
    sunday: workingHoursSchema,
  }),
  integrations: z.object({
    grabfood: z.boolean(),
    shopeefood: z.boolean(),
  }),
});

export type Step2FormValues = z.infer<typeof step2Schema>;
