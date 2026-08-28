export enum PaymentState {
  Pending = 'PENDING',
  Paid = 'PAID',
  Expired = 'EXPIRED',
  Cancelled = 'CANCELLED',
  Failed = 'FAILED',
  Refunded = 'REFUNDED',
}

export type PaymentProviderCapabilities = {
  supportsAutomaticWebhook: boolean;
  supportsManualStatus: boolean;
  supportsPendingCancel: boolean;
  requiresBackendPolling: boolean;
};

export type PaymentProviderReference = {
  transactionId?: string | null;
  orderId?: string | null;
  orderSn?: string | null;
  invoiceId?: string | null;
  refNo?: string | null;
};

export type CreatePaymentInput = {
  amount: number;
};

export type ProviderPaymentResult = {
  state: PaymentState;
  rawStatus: string;
  amount?: number;
  transactionId?: string;
  orderId?: string;
  orderSn?: string;
  invoiceId?: string;
  refNo?: string;
  qrString?: string;
  qrUrl?: string;
  checkoutUrl?: string;
  expiryTime?: string;
  paidAt?: Date;
};

export type VerifiedWebhook = {
  transactionId: string;
  orderId?: string;
  amount: number;
  state: PaymentState;
  rawStatus: string;
  paymentMethod: string;
  paidAt?: Date;
};

export interface ExternalPaymentProvider {
  capabilities(): PaymentProviderCapabilities;
  createPayment(input: CreatePaymentInput): Promise<ProviderPaymentResult>;
  getStatus(
    reference: PaymentProviderReference,
  ): Promise<ProviderPaymentResult>;
  cancelPendingPayment?(
    reference: PaymentProviderReference,
  ): Promise<ProviderPaymentResult>;
  verifyWebhook(rawBody: Buffer, signature: string): VerifiedWebhook;
}
