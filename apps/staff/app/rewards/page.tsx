'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type { LoyaltyProgram } from '@/lib/types';

export default function RewardsPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [currency, setCurrency] = useState('IDR');
  const [spendUnit, setSpendUnit] = useState('');
  const [pointsPerUnit, setPointsPerUnit] = useState('');
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const next = await apiJson<LoyaltyProgram[]>('/api/staff/rewards/programs');
      setPrograms(next);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Rewards programs could not load.',
      );
    }
  }, []);

  useEffect(() => {
    if (staff?.permissions.includes('rewards.manage')) void load();
  }, [staff, load]);

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening rewards…</main>;
  }

  if (!staff.permissions.includes('rewards.manage')) {
    return (
      <StaffShell staff={staff}>
        <div className="empty-panel">You do not have rewards management access.</div>
      </StaffShell>
    );
  }

  function edit(program: LoyaltyProgram) {
    setCurrency(program.currency);
    setSpendUnit(program.spendUnit.toString());
    setPointsPerUnit(program.pointsPerUnit.toString());
    setActive(program.active);
    setMessage('');
    setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedCurrency = currency.trim().toUpperCase();
    const parsedSpendUnit = Number.parseInt(spendUnit, 10);
    const parsedPointsPerUnit = Number.parseInt(pointsPerUnit, 10);

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError('Currency must use a 3-letter code such as IDR or MYR.');
      return;
    }

    if (parsedSpendUnit <= 0 || parsedPointsPerUnit <= 0) {
      setError('Spend unit and points per unit must be positive integers.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await apiJson<LoyaltyProgram>(
        `/api/staff/rewards/programs/${normalizedCurrency}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            spendUnit: parsedSpendUnit,
            pointsPerUnit: parsedPointsPerUnit,
            active,
          }),
        },
      );
      setMessage(`${normalizedCurrency} earning program saved.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Program update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">LOYALTY CONTROL</p>
          <h1>Fusion Points</h1>
          <p>
            Configure how eligible completed customer orders earn points. No
            program is active until an authorized staff member enables it.
          </p>
        </div>
      </header>

      {error ? <div className="inline-alert">{error}</div> : null}
      {message ? <div className="detail-card">{message}</div> : null}

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">EARNING PROGRAMS</p>
          <h2>Configured currencies</h2>
          <div className="team-list">
            {programs.length === 0 ? (
              <p>No rewards program configured yet.</p>
            ) : (
              programs.map((program) => (
                <article className="team-row" key={program.id}>
                  <div className="team-avatar">{program.currency}</div>
                  <div className="team-name">
                    <strong>{program.currency}</strong>
                    <span>
                      {program.pointsPerUnit} point(s) per {program.spendUnit}{' '}
                      minor currency units
                    </span>
                  </div>
                  <span className="team-role">
                    {program.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => edit(program)}
                  >
                    Edit
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">PROGRAM SETTINGS</p>
          <h2>{currency.trim().toUpperCase() || 'Currency'}</h2>
          <p>
            Example: spend unit 1000 and 1 point per unit awards 28 points for
            an eligible IDR 28,000 subtotal. Choose production values deliberately.
          </p>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Currency
              <input
                required
                maxLength={3}
                placeholder="IDR"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              />
            </label>
            <label>
              Spend unit (minor currency units)
              <input
                required
                min={1}
                inputMode="numeric"
                type="number"
                value={spendUnit}
                onChange={(event) => setSpendUnit(event.target.value)}
              />
            </label>
            <label>
              Points per spend unit
              <input
                required
                min={1}
                inputMode="numeric"
                type="number"
                value={pointsPerUnit}
                onChange={(event) => setPointsPerUnit(event.target.value)}
              />
            </label>
            <label>
              <span>Program status</span>
              <select
                value={active ? 'ACTIVE' : 'INACTIVE'}
                onChange={(event) => setActive(event.target.value === 'ACTIVE')}
              >
                <option value="INACTIVE">Inactive</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save rewards program'}
            </button>
          </form>
        </section>
      </div>
    </StaffShell>
  );
}
