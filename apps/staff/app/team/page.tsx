'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type { StaffUserView } from '@/lib/types';

const roles = [
  'OWNER',
  'OPERATIONS_MANAGER',
  'OUTLET_MANAGER',
  'CASHIER',
  'BARISTA',
  'INVENTORY_STAFF',
  'CUSTOMER_SUPPORT',
  'FINANCE',
] as const;

export default function TeamPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [team, setTeam] = useState<StaffUserView[]>([]);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      setTeam(await apiJson<StaffUserView[]>('/api/staff/users'));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Team could not load.');
    }
  }, []);

  useEffect(() => {
    if (staff?.permissions.includes('staff.manage')) void load();
  }, [staff, load]);

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening team…</main>;
  }

  if (!staff.permissions.includes('staff.manage')) {
    return (
      <StaffShell staff={staff}>
        <div className="empty-panel">You do not have staff management access.</div>
      </StaffShell>
    );
  }

  async function toggleStatus(member: StaffUserView) {
    try {
      await apiJson<StaffUserView>(`/api/staff/users/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
        }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed.');
    }
  }

  async function resetTotp(member: StaffUserView) {
    if (!window.confirm(`Reset authenticator for ${member.fullName}?`)) return;
    try {
      await apiJson<{ success: true }>(
        `/api/staff/users/${member.id}/reset-totp`,
        { method: 'POST' },
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'TOTP reset failed.');
    }
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">ACCESS CONTROL</p>
          <h1>Team</h1>
          <p>Create outlet staff and manage their current access state.</p>
        </div>
        <button
          className="primary-button compact-button"
          type="button"
          onClick={() => setShowCreate((value) => !value)}
        >
          {showCreate ? 'Close form' : 'Add staff'}
        </button>
      </header>

      {error ? <div className="inline-alert">{error}</div> : null}
      {showCreate ? <CreateStaffForm onCreated={load} /> : null}

      <div className="team-list">
        {team.map((member) => (
          <article className="team-row" key={member.id}>
            <div className="team-avatar">{initials(member.fullName)}</div>
            <div className="team-name">
              <strong>{member.fullName}</strong>
              <span>{member.email}</span>
            </div>
            <span className="team-role">{member.role.replaceAll('_', ' ')}</span>
            <span className={`status-badge ${member.status.toLowerCase()}`}>
              {member.status}
            </span>
            <div className="team-actions">
              <button
                className="text-button"
                type="button"
                onClick={() => void resetTotp(member)}
              >
                Reset TOTP
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => void toggleStatus(member)}
              >
                {member.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </StaffShell>
  );
}

function CreateStaffForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof roles)[number]>('BARISTA');
  const [outletId, setOutletId] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await apiJson<StaffUserView>('/api/staff/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          role,
          outletId: needsOutlet(role) ? outletId : null,
          initialPassword,
        }),
      });
      setFullName('');
      setEmail('');
      setInitialPassword('');
      await onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Staff creation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="create-staff-panel" onSubmit={submit}>
      <label>
        Full name
        <input
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </label>
      <label>
        Work email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Role
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
        >
          {roles.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </label>
      {needsOutlet(role) ? (
        <label>
          Outlet ID
          <input
            required
            value={outletId}
            onChange={(event) => setOutletId(event.target.value)}
          />
        </label>
      ) : null}
      <label>
        Initial password
        <input
          required
          minLength={8}
          type="password"
          autoComplete="new-password"
          value={initialPassword}
          onChange={(event) => setInitialPassword(event.target.value)}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" disabled={busy}>
        {busy ? 'Creating…' : 'Create staff'}
      </button>
    </form>
  );
}

function needsOutlet(role: string) {
  return ['OUTLET_MANAGER', 'CASHIER', 'BARISTA', 'INVENTORY_STAFF'].includes(
    role,
  );
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
