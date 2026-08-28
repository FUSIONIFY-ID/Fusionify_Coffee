export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  modifierOptionIds?: string[];
};

export type CreateOrderInput = {
  outletId: string;
  items: CreateOrderItemInput[];
};

export type SelectedModifierSnapshot = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
};
