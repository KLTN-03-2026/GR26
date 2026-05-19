import assert from 'node:assert/strict';
import type { ZodType } from 'zod';

export const expectValid = (schema: ZodType, payload: unknown) => {
  const result = schema.safeParse(payload);

  assert.equal(result.success, true, JSON.stringify(result.error?.issues ?? []));
};

export const expectInvalid = (schema: ZodType, payload: unknown, expectedMessage?: string) => {
  const result = schema.safeParse(payload);

  assert.equal(result.success, false, 'Payload dang duoc chap nhan ngoai mong doi');

  if (expectedMessage && !result.success) {
    assert.match(
      result.error.issues.map((issue) => issue.message).join(' | '),
      new RegExp(expectedMessage)
    );
  }
};
