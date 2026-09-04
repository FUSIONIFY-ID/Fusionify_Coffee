import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerVoucherStatus,
  OrderStatus,
  PaymentChannel,
  PaymentProvider,
  PaymentStatus,
  VoucherRedemptionStatus,
} from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { AutoGoPayGoPayProvider } from './providers/autogopay-gopay.provider';
import {
  PaymentProviderReference,
  PaymentState,
  ProviderPaymentResult,
} from './providers/payment-provider.types';

const prismaStatus: Record<PaymentState, PaymentStatus> = {
  [PaymentState.Pending]: PaymentStatus.PENDING,
  [PaymentState.Paid]: PaymentStatus.PAID,
  [PaymentState.Expired]: PaymentStatus.EXPIRED,
  [PaymentState.Cancelled]: PaymentStatus.CANCELLED,
  [PaymentState.Failed]: PaymentStatus.FAILED,
  [PaymentState.Refunded]: PaymentStatus.REFUNDED,
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoGoPay: AutoGoPayGoPayProvider,
  ) {}

  async createForOrder(
    orderId: string,
    userId: string,
    idempotencyKey: string,
    requestedChannel?: string,
  ) {
    return this.createAuthorizedPayment(
      orderId,
      idempotencyKey,
      requestedChannel,
      (order) => order.userId === userId,
    );
  }

  async createForStaffOrder(
    orderId: string,
    outletId: string | null,
    idempotencyKey: string,
    requestedChannel?: string,
  ) {
    return this.createAuthorizedPayment(
      orderId,
      idempotencyKey,
      requestedChannel,
      (order) => !outletId || order.outletId === outletId,
    );
  }

  private async createAuthorizedPayment(
    orderId: string,
    idempotencyKey: string,
    requestedChannel: string | undefined,
    authorize: (order: { userId: string | null; outletId: string }) => boolean,
  ) {
    this.validateIdempotencyKey(idempotencyKey);
    const channel = this.resolveChannel(requestedChannel);

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      if (
        existing.status === PaymentStatus.PENDING &&
        !existing.providerTransactionId
      ) {
        throw new ConflictException('Payment attempt is still initializing.');
      }
      return this.toView(existing);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: {
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PAID] },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!order || !authorize(order)) {
      throw new NotFoundException('Order not found.');
    }
    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new ConflictException('Order is not awaiting payment.');
    }
    if (order.totalAmount <= 0) {
      throw new ConflictException('Order does not require external payment.');
    }

    const paid = order.payments.find(
      (payment) => payment.status === PaymentStatus.PAID,
    );
    if (paid) throw new ConflictException('Order is already paid.');
    const pending = order.payments.find(
      (payment) => payment.status === PaymentStatus.PENDING,
    );
    if (pending?.providerTransactionId) return this.toView(pending);

    let reservedPaymentId: string;
    try {
      const reserved = await this.prisma.payment.create({
        data: {
          idempotencyKey,
          orderId,
          provider: PaymentProvider.AUTOGOPAY,
          channel,
          status: PaymentStatus.PENDING,
          amount: order.totalAmount,
          currency: order.currency,
        },
      });
      reservedPaymentId = reserved.id;
    } catch (error: unknown) {
      const concurrentPending = await this.prisma.payment.findFirst({
        where: { orderId, status: PaymentStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });
      if (concurrentPending) {
        if (!concurrentPending.providerTransactionId) {
          throw new ConflictException('Payment attempt is still initializing.');
        }
        return this.toView(concurrentPending);
      }
      throw error;
    }

    try {
      const providerResult = await this.autoGoPay.createPayment({
        amount: order.totalAmount,
      });
      return this.applyProviderResult(reservedPaymentId, providerResult);
    } catch (error: unknown) {
      await this.prisma.payment.update({
        where: { id: reservedPaymentId },
        data: {
          status: PaymentStatus.FAILED,
          providerRawStatus: 'provider_error',
        },
      });
      throw error;
    }
  }

  async checkForStaff(paymentId: string, outletId: string | null) {
    const payment = await this.getPaymentForStaff(paymentId, outletId);
    if (payment.status !== PaymentStatus.PENDING) return this.toView(payment);
    const result = await this.autoGoPay.getStatus(this.referenceFor(payment));
    return this.applyProviderResult(payment.id, result);
  }

  async cancelForStaff(paymentId: string, outletId: string | null) {
    const payment = await this.getPaymentForStaff(paymentId, outletId);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Only pending payments can be cancelled.');
    }
    if (
      !this.autoGoPay.capabilities().supportsPendingCancel ||
      !this.autoGoPay.cancelPendingPayment
    ) {
      throw new ConflictException(
        'This payment channel does not support cancellation.',
      );
    }
    const result = await this.autoGoPay.cancelPendingPayment(
      this.referenceFor(payment),
    );
    return this.applyProviderResult(payment.id, result);
  }

  async getView(paymentId: string, userId: string) {
    return this.toView(await this.getPayment(paymentId, userId));
  }

  async check(paymentId: string, userId: string) {
    const payment = await this.getPayment(paymentId, userId);
    if (payment.status !== PaymentStatus.PENDING) return this.toView(payment);
    const result = await this.autoGoPay.getStatus(this.referenceFor(payment));
    return this.applyProviderResult(payment.id, result);
  }

  async cancel(paymentId: string, userId: string) {
    const payment = await this.getPayment(paymentId, userId);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Only pending payments can be cancelled.');
    }
    if (
      !this.autoGoPay.capabilities().supportsPendingCancel ||
      !this.autoGoPay.cancelPendingPayment
    ) {
      throw new ConflictException(
        'This payment channel does not support cancellation.',
      );
    }
    const result = await this.autoGoPay.cancelPendingPayment(
      this.referenceFor(payment),
    );
    return this.applyProviderResult(payment.id, result);
  }

  async handleAutoGoPayWebhook(rawBody: Buffer, signature: string) {
    const webhook = this.autoGoPay.verifyWebhook(rawBody, signature);
    if (webhook.paymentMethod !== 'QRIS') {
      return { success: true, ignored: true, reason: 'unsupported_channel' };
    }
    const payment = await this.prisma.payment.findUnique({
      where: { providerTransactionId: webhook.transactionId },
    });
    if (!payment) {
      return { success: true, ignored: true, reason: 'payment_not_found' };
    }
    if (payment.amount !== webhook.amount) {
      throw new BadRequestException('Webhook amount mismatch.');
    }
    await this.applyProviderResult(payment.id, {
      state: webhook.state,
      rawStatus: webhook.rawStatus,
      amount: webhook.amount,
      transactionId: webhook.transactionId,
      orderId: webhook.orderId,
      paidAt: webhook.paidAt,
    });
    return { success: true };
  }

  private async applyProviderResult(
    paymentId: string,
    result: ProviderPaymentResult,
  ) {
    const payment = await this.getPayment(paymentId);
    if (result.amount !== undefined && result.amount !== payment.amount) {
      throw new BadRequestException('Payment provider amount mismatch.');
    }

    const status = prismaStatus[result.state];
    const paidAt =
      status === PaymentStatus.PAID
        ? (result.paidAt ?? payment.paidAt ?? new Date())
        : payment.paidAt;
    const cancelledAt =
      status === PaymentStatus.CANCELLED
        ? (payment.cancelledAt ?? new Date())
        : payment.cancelledAt;

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status,
          providerRawStatus: result.rawStatus,
          providerTransactionId:
            result.transactionId ?? payment.providerTransactionId,
          providerOrderId: result.orderId ?? payment.providerOrderId,
          providerOrderSn: result.orderSn ?? payment.providerOrderSn,
          providerInvoiceId: result.invoiceId ?? payment.providerInvoiceId,
          providerRefNo: result.refNo ?? payment.providerRefNo,
          providerQrString: result.qrString ?? payment.providerQrString,
          providerQrUrl: result.qrUrl ?? payment.providerQrUrl,
          providerCheckoutUrl:
            result.checkoutUrl ?? payment.providerCheckoutUrl,
          providerExpiryTime: result.expiryTime ?? payment.providerExpiryTime,
          paidAt,
          cancelledAt,
        },
      });

      if (status === PaymentStatus.PAID) {
        const confirmed = await tx.order.updateMany({
          where: {
            id: payment.orderId,
            status: OrderStatus.AWAITING_PAYMENT,
          },
          data: { status: OrderStatus.CONFIRMED },
        });
        if (confirmed.count === 1) {
          await tx.orderStatusEvent.create({
            data: {
              orderId: payment.orderId,
              fromStatus: OrderStatus.AWAITING_PAYMENT,
              toStatus: OrderStatus.CONFIRMED,
              note: 'Payment confirmed.',
            },
          });
        }

        const voucherRedemption = await tx.voucherRedemption.findUnique({
          where: { orderId: payment.orderId },
        });
        if (
          voucherRedemption?.status === VoucherRedemptionStatus.RESERVED
        ) {
          await tx.voucherRedemption.update({
            where: { id: voucherRedemption.id },
            data: {
              status: VoucherRedemptionStatus.APPLIED,
              appliedAt: paidAt ?? new Date(),
            },
          });
          await tx.customerVoucher.update({
            where: { id: voucherRedemption.customerVoucherId },
            data: { status: CustomerVoucherStatus.REDEEMED },
          });
        }
      }

      return nextPayment;
    });
    return this.toView(updated);
  }

  private async getPaymentForStaff(paymentId: string, outletId: string | null) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        ...(outletId ? { order: { outletId } } : {}),
      },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    return payment;
  }

  private async getPayment(paymentId: string, userId?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        ...(userId ? { order: { userId } } : {}),
      },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    return payment;
  }

  private referenceFor(payment: {
    providerTransactionId: string | null;
    providerOrderId: string | null;
    providerOrderSn: string | null;
    providerInvoiceId: string | null;
    providerRefNo: string | null;
  }): PaymentProviderReference {
    return {
      transactionId: payment.providerTransactionId,
      orderId: payment.providerOrderId,
      orderSn: payment.providerOrderSn,
      invoiceId: payment.providerInvoiceId,
      refNo: payment.providerRefNo,
    };
  }

  private resolveChannel(requestedChannel?: string): PaymentChannel {
    if (!requestedChannel || requestedChannel === PaymentChannel.GOPAY_QRIS) {
      return PaymentChannel.GOPAY_QRIS;
    }
    throw new BadRequestException(
      'Only GOPAY_QRIS is enabled for the initial payment milestone.',
    );
  }

  private validateIdempotencyKey(value: string) {
    if (!value || value.length > 128) {
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    }
  }

  private toView(payment: {
    id: string;
    orderId: string;
    provider: PaymentProvider;
    channel: PaymentChannel;
    status: PaymentStatus;
    amount: number;
    currency: string;
    providerQrString: string | null;
    providerQrUrl: string | null;
    providerCheckoutUrl: string | null;
    providerExpiryTime: string | null;
    providerRawStatus: string | null;
    paidAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      channel: payment.channel,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      qrString: payment.providerQrString,
      qrUrl: payment.providerQrUrl,
      checkoutUrl: payment.providerCheckoutUrl,
      expiryTime: payment.providerExpiryTime,
      providerRawStatus: payment.providerRawStatus,
      paidAt: payment.paidAt,
      cancelledAt: payment.cancelledAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
