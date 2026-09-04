'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { StaffProfile } from '@/lib/types';

export function StaffShell({
  staff,
  children,
}: {
  staff: StaffProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const canManageStaff = staff.permissions.includes('staff.manage');
  const canManageOrders = staff.permissions.includes('orders.manage');
  const canManageRewards = staff.permissions.includes('rewards.manage');
  const canReadInventory = staff.permissions.includes('inventory.read');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="staff-shell">
      <aside className="staff-rail">
        <div className="brand-lockup">
          <span className="brand-mark">F</span>
          <div>
            <strong>Fusionify Coffee</strong>
            <small>Staff Operations</small>
          </div>
        </div>

        <nav className="staff-nav" aria-label="Staff navigation">
          {canManageOrders ? (
            <Link
              className={pathname.startsWith('/pos') ? 'active' : ''}
              href="/pos"
            >
              <span>Counter</span>
              <small>POS</small>
            </Link>
          ) : null}
          <Link className={pathname.startsWith('/kds') ? 'active' : ''} href="/kds">
            <span>Queue</span>
            <small>KDS</small>
          </Link>
          {canReadInventory ? (
            <Link
              className={pathname.startsWith('/operations') ? 'active' : ''}
              href="/operations"
            >
              <span>Operations</span>
              <small>Inventory</small>
            </Link>
          ) : null}
          {canManageRewards ? (
            <Link
              className={pathname.startsWith('/rewards') ? 'active' : ''}
              href="/rewards"
            >
              <span>Rewards</span>
              <small>Points</small>
            </Link>
          ) : null}
          {canManageStaff ? (
            <Link
              className={pathname.startsWith('/team') ? 'active' : ''}
              href="/team"
            >
              <span>Team</span>
              <small>Staff</small>
            </Link>
          ) : null}
        </nav>

        <div className="staff-identity">
          <strong>{staff.fullName}</strong>
          <span>{staff.role.replaceAll('_', ' ')}</span>
          <button type="button" className="text-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="staff-main">{children}</main>
    </div>
  );
}
