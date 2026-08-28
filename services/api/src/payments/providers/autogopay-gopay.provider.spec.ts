import { createHmac } from 'node:crypto';
import { AutoGoPayGoPayProvider } from './autogopay-gopay.provider';
import { PaymentState } from './payment-provider.types';

describe('AutoGoPayGoPayProvider', () => {
  const originalApiKey = process.env.AUTOGOPAY_API_KEY;

  beforeEach(() => {
    process.env.AUTOGOPAY_API_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.AUTOGOPAY_API_KEY = originalApiKey;
    jest.restoreAllMocks();
  });

  it('normalizes a generated QRIS response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            transaction_id: 'trx-1',
            order_id: 'provider-order-1',
            amount: 28000,
            transaction_status: 'pending',
            qr_string: '000201-test',
            qr_url: 'https://example.invalid/qr.png',
            checkout_url: 'https://example.invalid/pay',
            expiry_time: '2026-08-28 15:00:00',
          },
        }),
    } as Response);

    const provider = new AutoGoPayGoPayProvider();
    const result = await provider.createPayment({ amount: 28000 });

    expect(result.state).toBe(PaymentState.Pending);
    expect(result.transactionId).toBe('trx-1');
    expect(result.qrString).toBe('000201-test');
  });

  it('verifies webhook HMAC against raw body', () => {
    const provider = new AutoGoPayGoPayProvider();
    const rawBody = Buffer.from(
      JSON.stringify({
        event: 'transaction.received',
        transaction: {
          transaction_id: 'trx-1',
          order_id: 'provider-order-1',
          amount: 28000,
          status: 'PAID',
          payment_method: 'QRIS',
        },
      }),
    );
    const signature = createHmac('sha256', 'test-secret')
      .update(rawBody)
      .digest('hex');

    const verified = provider.verifyWebhook(rawBody, signature);

    expect(verified.transactionId).toBe('trx-1');
    expect(verified.state).toBe(PaymentState.Paid);
    expect(verified.amount).toBe(28000);
  });
});
