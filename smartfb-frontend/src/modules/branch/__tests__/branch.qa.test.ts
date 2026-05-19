import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';
import { expectInvalid, expectValid } from '@/test/qa/schemaAssertions';
import { step1Schema } from '@modules/branch/schemas/step1Schema';

const validBranch = {
  name: 'Chi nhanh Quan 1',
  code: 'Q1',
  address: '1 Nguyen Hue',
  phone: '0901234567',
  latitude: 10.776,
  longitude: 106.7,
};

describe('QA branch module', () => {
  test('giu dung contract branch service/type/schema', () => {
    assertModuleContract({
      moduleName: 'branch',
      expectedSubdirs: ['components', 'hooks', 'schemas', 'services', 'types'],
      serviceFiles: ['services/branchService.ts', 'services/geoapifyService.ts'],
      typeFiles: ['types/branch.types.ts'],
      allowDirectAxiosServiceFiles: ['services/geoapifyService.ts'],
    });
  });

  test('validation happy path: tao chi nhanh hop le', () => {
    expectValid(step1Schema, validBranch);
    expectValid(step1Schema, { ...validBranch, latitude: null, longitude: null });
  });

  test('validation text: chan ten/ma rong, whitespace va qua dai', () => {
    expectInvalid(step1Schema, { ...validBranch, name: '' }, 'khong duoc de trong|không được để trống');
    expectInvalid(step1Schema, { ...validBranch, code: '   ' }, 'khong duoc de trong|không được để trống');
    expectInvalid(step1Schema, { ...validBranch, name: 'a'.repeat(101) }, '100');
    expectInvalid(step1Schema, { ...validBranch, address: 'a'.repeat(256) }, '255');
  });

  test('validation number: chan toa do ngoai mien va sai type', () => {
    expectInvalid(step1Schema, { ...validBranch, latitude: -91 }, 'Vi do|Vĩ độ');
    expectInvalid(step1Schema, { ...validBranch, latitude: 91 }, 'Vi do|Vĩ độ');
    expectInvalid(step1Schema, { ...validBranch, longitude: -181 }, 'Kinh do|Kinh độ');
    expectInvalid(step1Schema, { ...validBranch, longitude: 181 }, 'Kinh do|Kinh độ');
    expectInvalid(step1Schema, { ...validBranch, latitude: '10.7' });
  });

  test('validation edge cases: chan phone sai dinh dang va extra fields', () => {
    expectInvalid(step1Schema, { ...validBranch, phone: '123456789' }, 'Số điện thoại');
    expectInvalid(step1Schema, { ...validBranch, phone: '09012abcde' }, 'Số điện thoại');
    expectInvalid(step1Schema, { ...validBranch, extraField: 'khong-hop-le' });
  });
});
