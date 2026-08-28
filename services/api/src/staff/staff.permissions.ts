import { StaffRole } from '../generated/prisma/enums';
import { StaffPermission } from './staff.types';

const allPermissions = Object.values(StaffPermission);

export const staffRolePermissions: Record<StaffRole, StaffPermission[]> = {
  [StaffRole.SUPER_ADMIN]: allPermissions,
  [StaffRole.OWNER]: allPermissions,
  [StaffRole.OPERATIONS_MANAGER]: [
    StaffPermission.OrdersRead,
    StaffPermission.OrdersManage,
    StaffPermission.CatalogManage,
    StaffPermission.CustomersRead,
    StaffPermission.InventoryRead,
    StaffPermission.InventoryManage,
    StaffPermission.AuditRead,
  ],
  [StaffRole.OUTLET_MANAGER]: [
    StaffPermission.OrdersRead,
    StaffPermission.OrdersManage,
    StaffPermission.CustomersRead,
    StaffPermission.InventoryRead,
    StaffPermission.InventoryManage,
  ],
  [StaffRole.CASHIER]: [
    StaffPermission.OrdersRead,
    StaffPermission.OrdersManage,
  ],
  [StaffRole.BARISTA]: [
    StaffPermission.OrdersRead,
    StaffPermission.OrdersManage,
  ],
  [StaffRole.INVENTORY_STAFF]: [
    StaffPermission.InventoryRead,
    StaffPermission.InventoryManage,
  ],
  [StaffRole.CUSTOMER_SUPPORT]: [
    StaffPermission.OrdersRead,
    StaffPermission.CustomersRead,
  ],
  [StaffRole.FINANCE]: [
    StaffPermission.OrdersRead,
    StaffPermission.FinanceRead,
  ],
};

export function hasStaffPermission(
  role: StaffRole,
  permission: StaffPermission,
) {
  return staffRolePermissions[role].includes(permission);
}
