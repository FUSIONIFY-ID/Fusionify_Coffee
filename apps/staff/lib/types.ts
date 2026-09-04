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

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  type: 'INGREDIENT' | 'PACKAGING' | 'SUPPLY';
  baseUnit: string;
  costPerBaseUnit: number;
  active: boolean;
};

export type OutletInventoryLevel = {
  id: string;
  outletId: string;
  inventoryItemId: string;
  onHandBaseUnit: number;
  inventoryItem: InventoryItem;
};

export type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
};

export type PurchaseOrderItem = {
  id: string;
  inventoryItemId: string;
  quantityBaseUnit: number;
  receivedBaseUnit: number;
  unitCost: number;
  inventoryItem?: InventoryItem;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  outletId: string;
  currency: string;
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  notes: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  supplier: Supplier;
  items: PurchaseOrderItem[];
};

export type AssetMaintenance = {
  id: string;
  description: string;
  cost: number | null;
  performedAt: string;
};

export type StaffAsset = {
  id: string;
  outletId: string;
  assetTag: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
  purchaseDate: string | null;
  purchaseCost: number | null;
  serialNumber: string | null;
  notes: string | null;
  maintenances: AssetMaintenance[];
};
