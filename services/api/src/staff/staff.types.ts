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
