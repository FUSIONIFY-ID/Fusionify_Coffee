'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const canManageStaff = staff.permissions.includes('staff.manage');
  const canManageOrders = staff.permissions.includes('orders.manage');
  const canManageRewards = staff.permissions.includes('rewards.manage');
  const canManageCatalog = staff.permissions.includes('catalog.manage');
  const canReadInventory = staff.permissions.includes('inventory.read');
  const canReadFinance = staff.permissions.includes('finance.read');

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="staff-shell">
      <header className="staff-mobile-bar">
        <div className="brand-lockup">
          <span className="brand-mark">F</span>
          <div>
            <strong>Fusionify Coffee</strong>
            <small>Staff Operations</small>
          </div>
        </div>
        <button
          className="staff-menu-button"
          type="button"
          aria-label="Open staff navigation"
          aria-expanded={menuOpen}
          aria-controls="staff-navigation"
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <button
        className={`staff-nav-backdrop ${menuOpen ? 'open' : ''}`}
        type="button"
        aria-label="Close staff navigation"
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={`staff-rail ${menuOpen ? 'open' : ''}`}
        id="staff-navigation"
      >
        <div className="brand-lockup">
          <span className="brand-mark">F</span>
          <div>
            <strong>Fusionify Coffee</strong>
            <small>Staff Operations</small>
          </div>
          <button
            className="staff-rail-close"
            type="button"
            aria-label="Close staff navigation"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="staff-nav" aria-label="Staff navigation">
          {canReadFinance ? (
            <Link
              className={pathname.startsWith('/overview') ? 'active' : ''}
              href="/overview"
            >
              <span>Overview</span>
              <small>Business</small>
            </Link>
          ) : null}
          {canManageOrders ? (
            <Link
              className={pathname.startsWith('/pos') ? 'active' : ''}
              href="/pos"
            >
              <span>Counter</span>
              <small>POS</small>
            </Link>
          ) : null}
          <Link
            className={pathname.startsWith('/kds') ? 'active' : ''}
            href="/kds"
          >
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
          {canManageCatalog ? (
            <Link
              className={pathname.startsWith('/catalog') ? 'active' : ''}
              href="/catalog"
            >
              <span>Catalog</span>
              <small>Menu & media</small>
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
