import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpAtCounter,
  verifyTotp,
} from './totp.util';

describe('staff TOTP', () => {
  it('encrypts and decrypts TOTP secrets', () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  it('verifies a six-digit code in the current time step', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const now = 1_700_000_000_000;
    const counter = Math.floor(now / 30_000);
    const code = totpAtCounter(secret, counter);

    expect(verifyTotp(secret, code, now, 0)).toBe(true);
    expect(verifyTotp(secret, '000000', now, 0)).toBe(false);
  });
});
