import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encryptionKey() {
  const value = process.env.STAFF_TOTP_ENCRYPTION_KEY;
  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return Buffer.alloc(32, 7);
    }
    throw new Error('STAFF_TOTP_ENCRYPTION_KEY is required.');
  }

  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw new Error(
      'STAFF_TOTP_ENCRYPTION_KEY must decode to exactly 32 bytes.',
    );
  }
  return key;
}

export function generateTotpSecret(bytes = 20) {
  return encodeBase32(randomBytes(bytes));
}

export function buildTotpUri(email: string, secret: string) {
  const issuer = 'Fusionify Coffee';
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(
    issuer,
  )}&algorithm=SHA1&digits=6&period=30`;
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptTotpSecret(encoded: string) {
  const [ivValue, tagValue, ciphertextValue] = encoded.split('.');
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error('Stored TOTP secret is invalid.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function verifyTotp(
  secret: string,
  code: string,
  now = Date.now(),
  window = 1,
) {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const counter = Math.floor(now / 30_000);
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = totpAtCounter(secret, counter + offset);
    const left = Buffer.from(expected);
    const right = Buffer.from(code);
    if (left.length === right.length && timingSafeEqual(left, right)) {
      return true;
    }
  }
  return false;
}

export function totpAtCounter(secret: string, counter: number) {
  const key = decodeBase32(secret);
  const input = Buffer.alloc(8);
  input.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(input).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, '0');
}

function encodeBase32(input: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function decodeBase32(value: string) {
  const clean = value.toUpperCase().replace(/=+$/g, '');
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];

  for (const character of clean) {
    const index = alphabet.indexOf(character);
    if (index < 0) {
      throw new Error('TOTP secret contains an invalid base32 character.');
    }

    buffer = (buffer << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}
