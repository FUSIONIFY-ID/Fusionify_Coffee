import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function encryptionKey() {
  const value = process.env.DIGITAL_BENEFIT_ENCRYPTION_KEY;
  if (!value) {
    if (process.env.NODE_ENV === 'test') return Buffer.alloc(32, 11);
    throw new Error('DIGITAL_BENEFIT_ENCRYPTION_KEY is required.');
  }
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw new Error(
      'DIGITAL_BENEFIT_ENCRYPTION_KEY must decode to exactly 32 bytes.',
    );
  }
  return key;
}

export function encryptBenefitPayload(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptBenefitPayload<T>(value: string): T {
  const [ivValue, tagValue, payloadValue] = value.split('.');
  if (!ivValue || !tagValue || !payloadValue) {
    throw new Error('Encrypted benefit payload is invalid.');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payloadValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext) as T;
}
