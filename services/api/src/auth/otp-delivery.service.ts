import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  SupportedLanguage,
  SupportedOtpChannel,
  SupportedOtpPurpose,
} from './auth.types';

type DeliveryInput = {
  phoneE164: string;
  code: string;
  channel: SupportedOtpChannel;
  language: SupportedLanguage;
  purpose: SupportedOtpPurpose;
};

@Injectable()
export class OtpDeliveryService {
  async send(input: DeliveryInput) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const endpoint =
      input.channel === 'WHATSAPP'
        ? process.env.WHATSAPP_OTP_ENDPOINT
        : process.env.SMS_OTP_ENDPOINT;
    const token =
      input.channel === 'WHATSAPP'
        ? process.env.WHATSAPP_OTP_TOKEN
        : process.env.SMS_OTP_TOKEN;

    if (!endpoint || !token) {
      throw new ServiceUnavailableException(
        `${input.channel} OTP delivery is not configured.`,
      );
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          phone: input.phoneE164,
          code: input.code,
          language: input.language,
          purpose: input.purpose,
          product: 'Fusionify Coffee',
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ServiceUnavailableException(
        `${input.channel} OTP provider is unavailable.`,
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `${input.channel} OTP provider rejected the request.`,
      );
    }
  }
}
