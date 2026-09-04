export type StaffProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  outletId: string | null;
  totpEnabled: boolean;
  permissions: string[];
};

export type StaffOrderItem = {
  id: string;
  productName: string;
  quantity: number;
  lineTotal: number;
  selectedModifiers?: Array<{
    groupName: string;
    optionName: string;
    priceDelta: number;
  }>;
};

export type StaffOrder = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  outletId: string;
  outlet: { id: string; name: string };
  items: StaffOrderItem[];
  payments?: Array<{
    id: string;
    status: string;
    amount: number;
    channel: string;
  }>;
  statusEvents?: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    staffUser?: {
      id: string;
      fullName: string;
      role: string;
    } | null;
  }>;
};

export type StaffUserView = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  outletId: string | null;
  outlet?: { id: string; name: string } | null;
  totpEnabled: boolean;
  permissions: string[];
};

export type StaffCatalogModifierOption = {
  id: string;
  label: string;
  priceDelta: number;
  isDefault: boolean;
};

export type StaffCatalogModifierGroup = {
  id: string;
  label: string;
  required: boolean;
  allowMultiple: boolean;
  options: StaffCatalogModifierOption[];
};

export type StaffCatalogProduct = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category: string;
  basePrice: number;
  isBestseller: boolean;
  modifierGroups: StaffCatalogModifierGroup[];
};

export type StaffCatalog = {
  preview: boolean;
  language: string;
  outlet: {
    id: string;
    name: string;
    note: string;
    pickupEnabled: boolean;
  };
  products: StaffCatalogProduct[];
};

export type StaffPaymentView = {
  id: string;
  orderId: string;
  provider: string;
  channel: string;
  status: string;
  amount: number;
  currency: string;
  qrString: string | null;
  qrUrl: string | null;
  checkoutUrl: string | null;
  expiryTime: string | null;
  providerRawStatus: string | null;
};

export type LoyaltyProgram = {
  id: string;
  currency: string;
  spendUnit: number;
  pointsPerUnit: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MembershipTier = {
  id: string;
  currency: string;
  rank: number;
  name: string;
  translations: { ID_ID?: string; MS_MY?: string; EN?: string } | null;
  minimumQualifyingSpend: number;
  pointsMultiplierBps: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
