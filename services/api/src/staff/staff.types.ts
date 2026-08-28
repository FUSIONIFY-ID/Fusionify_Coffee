import type { StaffRole, StaffStatus } from '../generated/prisma/enums';

export enum StaffPermission {
  OrdersRead = 'orders.read',
  OrdersManage = 'orders.manage',
  CatalogManage = 'catalog.manage',
  CustomersRead = 'customers.read',
  InventoryRead = 'inventory.read',
  InventoryManage = 'inventory.manage',
  FinanceRead = 'finance.read',
  StaffManage = 'staff.manage',
  AuditRead = 'audit.read',
  SystemManage = 'system.manage',
}

export type StaffLoginInput = {
  email: string;
  password: string;
};

export type StaffTotpVerifyInput = {
  challengeToken: string;
  code: string;
};

export type StaffRefreshInput = {
  refreshToken: string;
};

export type CreateStaffInput = {
  fullName: string;
  email: string;
  role: StaffRole;
  outletId?: string | null;
  initialPassword: string;
};

export type UpdateStaffInput = {
  fullName?: string;
  role?: StaffRole;
  status?: StaffStatus;
  outletId?: string | null;
};

export type ResetStaffPasswordInput = {
  newPassword: string;
};
