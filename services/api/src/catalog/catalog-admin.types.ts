export type UpsertOutletInput = {
  name: string;
  note?: string;
  imageUrl?: string | null;
  currency: string;
  timezone?: string;
  active?: boolean;
  sortOrder?: number;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadiusMeters?: number | null;
  deliveryBaseFee?: number;
  deliveryPerKmFee?: number;
};

export type UpsertCategoryInput = {
  name: string;
  sortOrder?: number;
};

export type UpsertProductInput = {
  name: string;
  description: string;
  imageUrl?: string | null;
  basePrice: number;
  categoryId: string;
  active?: boolean;
  isBestseller?: boolean;
};

export type UpsertCampaignInput = {
  title: string;
  body: string;
  ctaLabel: string;
  imageUrl: string;
  actionPath: '/menu' | '/rewards';
  active?: boolean;
  sortOrder?: number;
};

export type SetOutletProductAvailabilityInput = {
  available: boolean;
};

export type UpsertModifierGroupInput = {
  name: string;
  active?: boolean;
  required?: boolean;
  allowMultiple?: boolean;
  sortOrder?: number;
  options: Array<{
    id: string;
    name: string;
    priceDelta: number;
    isDefault?: boolean;
    active?: boolean;
    sortOrder?: number;
  }>;
};
