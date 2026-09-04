import {
  decryptBenefitPayload,
  encryptBenefitPayload,
} from './benefit-crypto.util';

describe('digital benefit encryption', () => {
  it('round-trips payload without storing plaintext', () => {
    const payload = { ssid: 'Fusionify Coffee', password: 'secret-pass' };
    const encrypted = encryptBenefitPayload(payload);
    expect(encrypted).not.toContain('secret-pass');
    expect(decryptBenefitPayload<typeof payload>(encrypted)).toEqual(payload);
  });
});
