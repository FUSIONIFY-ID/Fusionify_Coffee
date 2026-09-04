import type { PhoneCountry } from '../generated/prisma/enums';

export type SaveAddressInput = {
  label: string;
  recipientName: string;
  phone: string;
  country: PhoneCountry;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  deliveryNotes?: string | null;
  isDefault?: boolean;
};
