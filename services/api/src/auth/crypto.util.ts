import {
  createHmac,
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;

function requirePepper(name: 'OTP_PEPPER' | 'AUTH_TOKEN_PEPPER') {
  const value = process.env[name];

  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return `fusionify-test-${name.toLowerCase()}`;
    }

    throw new Error(`${name} is required.`);
  }

  return value;
}

export function createOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(phoneE164: string, purpose: string, code: string) {
  return createHmac('sha256', requirePepper('OTP_PEPPER'))
    .update(`${phoneE164}|${purpose}|${code}`)
    .digest('hex');
}

export function createOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string) {
  return createHmac('sha256', requirePepper('AUTH_TOKEN_PEPPER'))
    .update(token)
    .digest('hex');
}

export async function hashPassword(password: string) {
  validatePassword(password);
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, passwordKeyLength)) as Buffer;

  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltValue, hashValue] = encoded.split('$');

  if (algorithm !== 'scrypt' || !saltValue || !hashValue) {
    return false;
  }

  const salt = Buffer.from(saltValue, 'base64url');
  const expected = Buffer.from(hashValue, 'base64url');
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function validatePassword(password: string) {
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new Error('Password must contain between 8 and 128 characters.');
  }
}
