import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';
import { resolvePaymentMethodLabel } from '@modules/payment/utils/paymentPresentation';

describe('QA payment module', () => {
  test('giu dung contract payment service/type', () => {
    assertModuleContract({
      moduleName: 'payment',
      expectedSubdirs: ['components', 'hooks', 'services', 'types', 'utils'],
      serviceFiles: ['services/paymentService.ts'],
      typeFiles: ['types/payment.types.ts'],
    });
  });

  test('business logic: hien thi nhan payment method on dinh voi input bien', () => {
    assert.equal(resolvePaymentMethodLabel('cash'), 'Tiền mặt');
    assert.equal(resolvePaymentMethodLabel(' VIETQR '), 'VietQR');
    assert.equal(resolvePaymentMethodLabel(null), 'Chưa xác định');
    assert.equal(resolvePaymentMethodLabel('CUSTOM'), 'CUSTOM');
  });
});
