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
