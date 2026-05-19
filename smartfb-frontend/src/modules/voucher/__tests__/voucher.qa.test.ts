import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';
import { expectInvalid, expectValid } from '@/test/qa/schemaAssertions';
import { createVoucherSchema } from '@modules/voucher/schemas/voucherSchema';

const validVoucher = {
  code: 'SUMMER2026',
  name: 'Khuyen mai he',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderValue: 100000,
  startDate: '2026-05-16',
  endDate: '2026-05-31',
};

describe('QA voucher module', () => {
  test('giu dung contract voucher service/type/schema', () => {
    assertModuleContract({
      moduleName: 'voucher',
      expectedSubdirs: ['components', 'data', 'hooks', 'schemas', 'services', 'types'],
      serviceFiles: ['services/voucherService.ts'],
      typeFiles: ['types/voucher.types.ts'],
    });
  });

  test('validation voucher: happy path va code/name constraints', () => {
    expectValid(createVoucherSchema, validVoucher);
    expectInvalid(createVoucherSchema, { ...validVoucher, code: '' }, 'khong duoc de trong|không được để trống');
    expectInvalid(createVoucherSchema, { ...validVoucher, code: 'sale10' }, 'chu hoa|chữ hoa');
    expectInvalid(createVoucherSchema, { ...validVoucher, code: 'DROP TABLE' }, 'chu hoa|chữ hoa');
    expectInvalid(createVoucherSchema, { ...validVoucher, code: 'A'.repeat(51) }, '50');
    expectInvalid(createVoucherSchema, { ...validVoucher, name: '   ' }, 'khong duoc de trong|không được để trống');
  });

  test('validation voucher: discount/date required va wrong type', () => {
    expectInvalid(createVoucherSchema, { ...validVoucher, discountType: 'UNKNOWN' });
    expectInvalid(createVoucherSchema, { ...validVoucher, discountValue: 0 }, 'lon hon 0|lớn hơn 0');
    expectInvalid(createVoucherSchema, { ...validVoucher, discountValue: -1 }, 'lon hon 0|lớn hơn 0');
    expectInvalid(createVoucherSchema, { ...validVoucher, discountValue: '10' });
    expectInvalid(createVoucherSchema, { ...validVoucher, startDate: '' }, 'ngay bat dau|ngày bắt đầu');
    expectInvalid(createVoucherSchema, { ...validVoucher, endDate: '' }, 'ngay ket thuc|ngày kết thúc');
  });

  test('validation voucher: chan percent vuot 100, date sai va minOrderValue am', () => {
    expectInvalid(createVoucherSchema, { ...validVoucher, discountValue: 101 }, '100');
    expectInvalid(createVoucherSchema, { ...validVoucher, minOrderValue: -1 }, 'không được âm');
    expectInvalid(createVoucherSchema, { ...validVoucher, startDate: '2026-02-31' }, 'không hợp lệ');
    expectInvalid(createVoucherSchema, { ...validVoucher, endDate: 'abc' }, 'không hợp lệ');
    expectInvalid(
      createVoucherSchema,
      { ...validVoucher, startDate: '2026-06-01', endDate: '2026-05-31' },
      'sau hoặc bằng'
    );
  });
});
