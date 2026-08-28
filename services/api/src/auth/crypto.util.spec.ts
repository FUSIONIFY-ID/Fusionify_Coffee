import { hashPassword, verifyPassword } from './crypto.util';

describe('password hashing', () => {
  it('hashes and verifies a password without storing plaintext', async () => {
    const encoded = await hashPassword('Fusionify-2026');

    expect(encoded).not.toContain('Fusionify-2026');
    await expect(verifyPassword('Fusionify-2026', encoded)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', encoded)).resolves.toBe(
      false,
    );
  });
});
