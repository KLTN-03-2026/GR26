import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assertModuleContract, assertNoConsoleLog } from '@/test/qa/moduleContract';
import {
  CHECK_IN_OPEN_BEFORE_MINUTES,
  getShiftCheckInOpenAt,
  isShiftCheckInOpen,
} from '@modules/shift/utils/shiftDateGuard';
import type { LocalTime } from '@modules/shift/types/shift.types';

describe('QA shift module', () => {
  test('giu dung contract ca lam viec', () => {
    assertModuleContract({
      moduleName: 'shift',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/shiftService.ts'],
      typeFiles: ['types/shift.types.ts'],
    });
  });

  test('khong con console.log debug trong luong check-in', () => {
    assertNoConsoleLog('src/modules/shift/hooks/useShiftSchedules.ts');
  });

  test('chi mo check-in tu 30 phut truoc gio bat dau ca', () => {
    const startTime: LocalTime = { hour: 8, minute: 0, second: 0, nano: 0 };
    const openAt = getShiftCheckInOpenAt('2026-05-17', startTime);

    assert.equal(CHECK_IN_OPEN_BEFORE_MINUTES, 30);
    assert.equal(openAt?.getHours(), 7);
    assert.equal(openAt?.getMinutes(), 30);
    assert.equal(isShiftCheckInOpen('2026-05-17', startTime, new Date(2026, 4, 17, 7, 29)), false);
    assert.equal(isShiftCheckInOpen('2026-05-17', startTime, new Date(2026, 4, 17, 7, 30)), true);
    assert.equal(isShiftCheckInOpen('2026-05-17', startTime, new Date(2026, 4, 17, 8, 15)), true);
  });
});
