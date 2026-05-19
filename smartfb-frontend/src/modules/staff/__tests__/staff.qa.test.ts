import { describe, test } from 'node:test';
import { assertModuleContract, assertNoConsoleLog } from '@/test/qa/moduleContract';
import { expectInvalid, expectValid } from '@/test/qa/schemaAssertions';
import { positionSchema } from '@modules/staff/schemas/positionSchema';
import { roleSchema } from '@modules/staff/schemas/roleSchema';

describe('QA staff module', () => {
  test('giu dung contract nhan su', () => {
    assertModuleContract({
      moduleName: 'staff',
      expectedSubdirs: ['components', 'hooks', 'schemas', 'services', 'types', 'utils'],
      serviceFiles: [
        'services/positionService.ts',
        'services/roleService.ts',
        'services/staffService.ts',
        'services/vietnamAddressService.ts',
      ],
      typeFiles: [
        'types/position.types.ts',
        'types/role.types.ts',
        'types/staff.types.ts',
        'types/vietnamAddress.types.ts',
      ],
      allowDirectAxiosServiceFiles: ['services/vietnamAddressService.ts'],
    });
  });

  test('validation position: happy path, empty, whitespace, max length', () => {
    expectValid(positionSchema, { name: 'Thu ngan', description: 'Nhan order va thanh toan' });
    expectInvalid(positionSchema, { name: '', description: '' }, 'khong duoc de trong|Không được để trống');
    expectInvalid(positionSchema, { name: '   ', description: '' }, 'khong duoc de trong|Không được để trống');
    expectInvalid(positionSchema, { name: 'a'.repeat(101), description: '' }, '100');
    expectInvalid(positionSchema, { name: 'Thu ngan', description: 'a'.repeat(256) }, '255');
  });

  test('validation role: min length, max length va wrong type', () => {
    expectValid(roleSchema, { name: 'QL', description: 'Quan ly chi nhanh' });
    expectInvalid(roleSchema, { name: 'A', description: '' }, '2');
    expectInvalid(roleSchema, { name: 'a'.repeat(101), description: '' }, '100');
    expectInvalid(roleSchema, { name: null, description: '' });
  });

  test('khong con console.log debug khi submit position', () => {
    assertNoConsoleLog('src/modules/staff/components/PositionFormDialog.tsx');
  });
});
