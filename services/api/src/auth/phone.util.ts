import { BadRequestException } from '@nestjs/common';
import type { SupportedPhoneCountry } from './auth.types';

export type NormalizedPhone = {
  country: SupportedPhoneCountry;
  e164: string;
  national: string;
};

export function normalizeSupportedPhone(
  country: SupportedPhoneCountry,
  input: string,
): NormalizedPhone {
  const digits = input.replace(/\D/g, '');

  if (country === 'ID') {
    let national = digits;
    if (national.startsWith('62')) {
      national = national.substring(2);
    } else if (national.startsWith('0')) {
      national = national.substring(1);
    }

    if (!/^8\d{8,11}$/.test(national)) {
      throw new BadRequestException(
        'Enter a valid Indonesian mobile number.',
      );
    }

    return {
      country,
      national,
      e164: `+62${national}`,
    };
  }

  if (country === 'MY') {
    let national = digits;
    if (national.startsWith('60')) {
      national = national.substring(2);
    } else if (national.startsWith('0')) {
      national = national.substring(1);
    }

    if (!/^1\d{8,9}$/.test(national)) {
      throw new BadRequestException('Enter a valid Malaysian mobile number.');
    }

    return {
      country,
      national,
      e164: `+60${national}`,
    };
  }

  throw new BadRequestException(
    'Fusionify Coffee currently supports Indonesia and Malaysia only.',
  );
}
