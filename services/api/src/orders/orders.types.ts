import type { FulfillmentType } from '../generated/prisma/enums';

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  modifierOptionIds?: string[];
};

export type CreateOrderInput = {
  outletId: string;
  items: CreateOrderItemInput[];
  fulfillmentType?: FulfillmentType;
  scheduledFor?: string | null;
  savedAddressId?: string | null;
  customerVoucherId?: string | null;
};

export type SelectedModifierSnapshot = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
};
