import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreatePaymentInput,
  ExternalPaymentProvider,
  PaymentProviderCapabilities,
  PaymentProviderReference,
  PaymentState,
  ProviderPaymentResult,
  VerifiedWebhook,
} from './payment-provider.types';

type AutoGoPayEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type AutoGoPayCreateData = {
  transaction_id: string;
  order_id: string;
  amount: number;
  transaction_status: string;
  qr_string: string;
  qr_url: string;
  checkout_url?: string;
  expiry_time?: string;
};

type AutoGoPayStatusData = {
  transaction_id?: string;
  order_id?: string;
  amount?: number;
  transaction_status?: string;
  status?: string;
  paid_at?: string;
};

type AutoGoPayWebhookPayload = {
  event: string;
  transaction: {
    transaction_id: string;
    order_id?: string;
    amount: number;
    status: string;
    payment_method: string;
    paid_at?: string;
  };
};

@Injectable()
export class AutoGoPayGoPayProvider implements ExternalPaymentProvider {
  private readonly baseUrl =
    process.env.AUTOGOPAY_BASE_URL ?? 'https://v1-gateway.autogopay.site';

  capabilities(): PaymentProviderCapabilities {
    return {
      supportsAutomaticWebhook: true,
      supportsManualStatus: true,
      supportsPendingCancel: true,
      requiresBackendPolling: false,
    };
  }

  async createPayment(
    input: CreatePaymentInput,
  ): Promise<ProviderPaymentResult> {
    const data = await this.request<AutoGoPayCreateData>('/qris/generate', {
      amount: input.amount,
    });

    if (data.amount !== input.amount) {
      throw new ServiceUnavailableException(
        'Payment provider returned an unexpected amount.',
      );
    }

    return {
      state: this.normalizeStatus(data.transaction_status),
      rawStatus: data.transaction_status,
      amount: data.amount,
      transactionId: data.transaction_id,
      orderId: data.order_id,
      qrString: data.qr_string,
      qrUrl: data.qr_url,
      checkoutUrl: data.checkout_url,
      expiryTime: data.expiry_time,
    };
  }

  async getStatus(
    reference: PaymentProviderReference,
  ): Promise<ProviderPaymentResult> {
    const transactionId = this.requireTransactionId(reference);
    const data = await this.request<AutoGoPayStatusData>('/qris/status', {
      transaction_id: transactionId,
    });
    const rawStatus = data.transaction_status ?? data.status ?? 'pending';

    return {
      state: this.normalizeStatus(rawStatus),
      rawStatus,
      amount: data.amount,
      transactionId: data.transaction_id ?? transactionId,
      orderId: data.order_id,
      paidAt: this.parseProviderDate(data.paid_at),
    };
  }

  async cancelPendingPayment(
    reference: PaymentProviderReference,
  ): Promise<ProviderPaymentResult> {
    const transactionId = this.requireTransactionId(reference);
    const data = await this.request<AutoGoPayStatusData>('/qris/cancel', {
      transaction_id: transactionId,
    });
    const rawStatus = data.transaction_status ?? data.status ?? 'cancel';

    return {
      state: this.normalizeStatus(rawStatus),
      rawStatus,
      amount: data.amount,
      transactionId: data.transaction_id ?? transactionId,
      orderId: data.order_id,
    };
  }

  verifyWebhook(rawBody: Buffer, signature: string): VerifiedWebhook {
    const apiKey = this.requireApiKey();
    const expected = createHmac('sha256', apiKey).update(rawBody).digest('hex');

    const expectedBuffer = Buffer.from(expected, 'utf8');
    const signatureBuffer = Buffer.from(signature ?? '', 'utf8');

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      throw new UnauthorizedException(
        'Invalid payment provider webhook signature.',
      );
    }

    let payload: AutoGoPayWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as AutoGoPayWebhookPayload;
    } catch {
      throw new ServiceUnavailableException('Invalid webhook payload.');
    }

    if (
      payload.event !== 'transaction.received' ||
      !payload.transaction?.transaction_id
    ) {
      throw new ServiceUnavailableException('Unsupported webhook payload.');
    }

    return {
      transactionId: payload.transaction.transaction_id,
      orderId: payload.transaction.order_id,
      amount: payload.transaction.amount,
      state: this.normalizeStatus(payload.transaction.status),
      rawStatus: payload.transaction.status,
      paymentMethod: payload.transaction.payment_method,
      paidAt: this.parseProviderDate(payload.transaction.paid_at),
    };
  }

  private async request<T>(
    path: string,
    body: Record<string, string | number>,
  ): Promise<T> {
    const apiKey = this.requireApiKey();

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Payment provider is currently unavailable.',
      );
    }

    let envelope: AutoGoPayEnvelope<T>;
    try {
      envelope = (await response.json()) as AutoGoPayEnvelope<T>;
    } catch {
      throw new ServiceUnavailableException(
        'Payment provider returned an invalid response.',
      );
    }

    if (!response.ok || !envelope.success || !envelope.data) {
      throw new ServiceUnavailableException(
        envelope.message || 'Payment provider request failed.',
      );
    }

    return envelope.data;
  }

  private requireApiKey() {
    const apiKey = process.env.AUTOGOPAY_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AutoGoPay is not configured on this server.',
      );
    }
    return apiKey;
  }

  private requireTransactionId(reference: PaymentProviderReference) {
    if (!reference.transactionId) {
      throw new ServiceUnavailableException(
        'Payment provider transaction reference is missing.',
      );
    }
    return reference.transactionId;
  }

  private normalizeStatus(rawStatus: string): PaymentState {
    switch (rawStatus.toLowerCase()) {
      case 'settlement':
      case 'paid':
      case 'success':
        return PaymentState.Paid;
      case 'expire':
      case 'expired':
        return PaymentState.Expired;
      case 'cancel':
      case 'cancelled':
        return PaymentState.Cancelled;
      case 'failed':
        return PaymentState.Failed;
      case 'refunded':
        return PaymentState.Refunded;
      case 'pending':
      default:
        return PaymentState.Pending;
    }
  }

  private parseProviderDate(value?: string) {
    if (!value) {
      return undefined;
    }

    const normalized = value.includes('T')
      ? value
      : value.replace(' ', 'T') + '+07:00';
    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
