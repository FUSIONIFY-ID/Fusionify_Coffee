'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type { LoyaltyProgram, MembershipTier } from '@/lib/types';

export default function RewardsPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [currency, setCurrency] = useState('IDR');
  const [spendUnit, setSpendUnit] = useState('');
  const [pointsPerUnit, setPointsPerUnit] = useState('');
  const [active, setActive] = useState(false);
  const [tierCurrency, setTierCurrency] = useState('IDR');
  const [tierRank, setTierRank] = useState('0');
  const [tierName, setTierName] = useState('');
  const [tierNameId, setTierNameId] = useState('');
  const [tierNameMs, setTierNameMs] = useState('');
  const [tierNameEn, setTierNameEn] = useState('');
  const [tierMinimumSpend, setTierMinimumSpend] = useState('');
  const [tierMultiplier, setTierMultiplier] = useState('1.00');
  const [tierActive, setTierActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [nextPrograms, nextTiers] = await Promise.all([
        apiJson<LoyaltyProgram[]>('/api/staff/rewards/programs'),
        apiJson<MembershipTier[]>('/api/staff/rewards/membership-tiers'),
      ]);
      setPrograms(nextPrograms);
      setTiers(nextTiers);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Rewards and membership settings could not load.',
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

  function editTier(tier: MembershipTier) {
    setTierCurrency(tier.currency);
    setTierRank(tier.rank.toString());
    setTierName(tier.name);
    setTierNameId(tier.translations?.ID_ID ?? '');
    setTierNameMs(tier.translations?.MS_MY ?? '');
    setTierNameEn(tier.translations?.EN ?? '');
    setTierMinimumSpend(tier.minimumQualifyingSpend.toString());
    setTierMultiplier((tier.pointsMultiplierBps / 10000).toFixed(2));
    setTierActive(tier.active);
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

  async function submitTier(event: FormEvent) {
    event.preventDefault();
    const normalizedCurrency = tierCurrency.trim().toUpperCase();
    const rank = Number.parseInt(tierRank, 10);
    const minimumQualifyingSpend = Number.parseInt(tierMinimumSpend, 10);
    const multiplier = Number.parseFloat(tierMultiplier);
    const pointsMultiplierBps = Math.round(multiplier * 10000);

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError('Tier currency must use a 3-letter code such as IDR or MYR.');
      return;
    }
    if (!Number.isInteger(rank) || rank < 0) {
      setError('Tier rank must be a non-negative integer.');
      return;
    }
    if (!tierName.trim()) {
      setError('Tier name is required.');
      return;
    }
    if (!Number.isInteger(minimumQualifyingSpend) || minimumQualifyingSpend < 0) {
      setError('Minimum qualifying spend must be a non-negative integer.');
      return;
    }
    if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 5) {
      setError('Points multiplier must be between 1.00× and 5.00×.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiJson<MembershipTier>(
        `/api/staff/rewards/membership-tiers/${normalizedCurrency}/${rank}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: tierName.trim(),
            translations: {
              ...(tierNameId.trim() ? { ID_ID: tierNameId.trim() } : {}),
              ...(tierNameMs.trim() ? { MS_MY: tierNameMs.trim() } : {}),
              ...(tierNameEn.trim() ? { EN: tierNameEn.trim() } : {}),
            },
            minimumQualifyingSpend,
            pointsMultiplierBps,
            active: tierActive,
          }),
        },
      );
      setMessage(`${normalizedCurrency} membership tier rank ${rank} saved.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tier update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">LOYALTY CONTROL</p>
          <h1>Fusion Points & Membership</h1>
          <p>
            Configure earning rates and real membership benefits. No tier is
            active until an authorized staff member deliberately enables it.
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
                  <button className="text-button" type="button" onClick={() => edit(program)}>
                    Edit
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">POINTS SETTINGS</p>
          <h2>{currency.trim().toUpperCase() || 'Currency'}</h2>
          <p>
            Example values are not activated automatically. Choose production
            earning values deliberately for each currency.
          </p>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Currency
              <input required maxLength={3} placeholder="IDR" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
            </label>
            <label>
              Spend unit (minor currency units)
              <input required min={1} inputMode="numeric" type="number" value={spendUnit} onChange={(event) => setSpendUnit(event.target.value)} />
            </label>
            <label>
              Points per spend unit
              <input required min={1} inputMode="numeric" type="number" value={pointsPerUnit} onChange={(event) => setPointsPerUnit(event.target.value)} />
            </label>
            <label>
              <span>Program status</span>
              <select value={active ? 'ACTIVE' : 'INACTIVE'} onChange={(event) => setActive(event.target.value === 'ACTIVE')}>
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

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">MEMBERSHIP TIERS</p>
          <h2>Configured tiers</h2>
          <p>
            Qualification uses completed customer spend. A newly reached tier
            applies its points multiplier starting with the next completed order.
          </p>
          <div className="team-list">
            {tiers.length === 0 ? (
              <p>No membership tiers configured. Customers remain base members.</p>
            ) : (
              tiers.map((tier) => (
                <article className="team-row" key={tier.id}>
                  <div className="team-avatar">{tier.rank}</div>
                  <div className="team-name">
                    <strong>{tier.name}</strong>
                    <span>
                      {tier.currency} · from {tier.minimumQualifyingSpend} ·{' '}
                      {(tier.pointsMultiplierBps / 10000).toFixed(2)}× points
                    </span>
                  </div>
                  <span className="team-role">{tier.active ? 'ACTIVE' : 'INACTIVE'}</span>
                  <button className="text-button" type="button" onClick={() => editTier(tier)}>
                    Edit
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">TIER SETTINGS</p>
          <h2>{tierName.trim() || 'Membership tier'}</h2>
          <form className="form-stack" onSubmit={submitTier}>
            <label>
              Currency
              <input required maxLength={3} placeholder="IDR" value={tierCurrency} onChange={(event) => setTierCurrency(event.target.value.toUpperCase())} />
            </label>
            <label>
              Rank
              <input required min={0} type="number" inputMode="numeric" value={tierRank} onChange={(event) => setTierRank(event.target.value)} />
            </label>
            <label>
              Default tier name
              <input required maxLength={40} value={tierName} onChange={(event) => setTierName(event.target.value)} />
            </label>
            <label>
              Bahasa Indonesia name (optional)
              <input maxLength={40} value={tierNameId} onChange={(event) => setTierNameId(event.target.value)} />
            </label>
            <label>
              Bahasa Melayu name (optional)
              <input maxLength={40} value={tierNameMs} onChange={(event) => setTierNameMs(event.target.value)} />
            </label>
            <label>
              English name (optional)
              <input maxLength={40} value={tierNameEn} onChange={(event) => setTierNameEn(event.target.value)} />
            </label>
            <label>
              Minimum qualifying spend (minor currency units)
              <input required min={0} type="number" inputMode="numeric" value={tierMinimumSpend} onChange={(event) => setTierMinimumSpend(event.target.value)} />
            </label>
            <label>
              Points multiplier (1.00×–5.00×)
              <input required min={1} max={5} step="0.01" type="number" inputMode="decimal" value={tierMultiplier} onChange={(event) => setTierMultiplier(event.target.value)} />
            </label>
            <label>
              <span>Tier status</span>
              <select value={tierActive ? 'ACTIVE' : 'INACTIVE'} onChange={(event) => setTierActive(event.target.value === 'ACTIVE')}>
                <option value="INACTIVE">Inactive</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save membership tier'}
            </button>
          </form>
        </section>
      </div>
    </StaffShell>
  );
}
