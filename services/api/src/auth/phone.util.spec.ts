import { BadRequestException } from '@nestjs/common';
import { normalizeSupportedPhone } from './phone.util';

describe('normalizeSupportedPhone', () => {
  it('normalizes Indonesian local mobile numbers', () => {
    expect(normalizeSupportedPhone('ID', '0812-3456-7890').e164).toBe(
      '+6281234567890',
    );
  });

  it('normalizes Malaysian local mobile numbers', () => {
    expect(normalizeSupportedPhone('MY', '012-345-6789').e164).toBe(
      '+60123456789',
    );
  });

  it('rejects unsupported mobile shapes', () => {
    expect(() => normalizeSupportedPhone('ID', '+14155552671')).toThrow(
      BadRequestException,
    );
  });
});
