import type { VoucherDiscountType } from '../generated/prisma/enums';

export type VoucherTranslations = {
  ID_ID?: { title?: string; description?: string };
  MS_MY?: { title?: string; description?: string };
  EN?: { title?: string; description?: string };
};

export type ConfigureVoucherInput = {
  title: string;
  description?: string;
  translations?: VoucherTranslations;
  currency: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minimumSpend?: number;
  maximumDiscount?: number | null;
  outletId?: string | null;
  validFrom: string;
  validUntil: string;
  active: boolean;
};

export type IssueVoucherInput = {
  userId: string;
  expiresAt?: string | null;
  source?: string;
};
