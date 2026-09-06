'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OutletSelector } from '@/components/outlet-selector';
import { OwnerSalesChart } from '@/components/owner-sales-chart';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type {
  OwnerDashboard,
  OwnerDashboardOutletPerformance,
} from '@/lib/types';

const ranges = [7, 30, 90] as const;

export default function OwnerOverviewPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [rangeDays, setRangeDays] = useState<(typeof ranges)[number]>(7);
  const [outletId, setOutletId] = useState('');
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null);
  const [chartCurrency, setChartCurrency] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canReadFinance = staff?.permissions.includes('finance.read') ?? false;

  const load = useCallback(async () => {
    if (!canReadFinance) return;
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ rangeDays: String(rangeDays) });
      if (outletId) query.set('outletId', outletId);
      const next = await apiJson<OwnerDashboard>(
        `/api/staff/owner-dashboard?${query}`,
      );
      setDashboard(next);
      setChartCurrency((current) =>
        next.currencyTotals.some((total) => total.currency === current)
          ? current
          : (next.currencyTotals[0]?.currency ?? ''),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Owner dashboard could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [canReadFinance, outletId, rangeDays]);

  useEffect(() => {
    if (staff && canReadFinance) void load();
  }, [staff, canReadFinance, load]);

  const outlets = dashboard?.outlets ?? [];
  const selectedTotal = dashboard?.currencyTotals.find(
    (total) => total.currency === chartCurrency,
  );
  const filteredOutlets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dashboard?.outletPerformance ?? [];
    return (dashboard?.outletPerformance ?? []).filter((outlet) =>
      `${outlet.name} ${outlet.id}`.toLowerCase().includes(query),
    );
  }, [dashboard?.outletPerformance, search]);

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening owner dashboard…</main>;
  }

  if (!canReadFinance) {
    return (
      <StaffShell staff={staff}>
        <div className="empty-panel">
          Your role does not have access to business reporting.
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell staff={staff}>
      <header className="owner-heading">
        <div>
          <h1>Owner Control Center</h1>
          <p>Monitor paid sales, fulfillment, and outlet operations.</p>
        </div>
        <div className="owner-filters">
          <label className="outlet-selector">
            <span>Date range</span>
            <select
              aria-label="Date range"
              value={rangeDays}
              onChange={(event) =>
                setRangeDays(
                  Number(event.target.value) as (typeof ranges)[number],
                )
              }
            >
              {ranges.map((range) => (
                <option value={range} key={range}>
                  Last {range} days
                </option>
              ))}
            </select>
          </label>
          <OutletSelector
            outlets={outlets}
            value={outletId}
            onChange={setOutletId}
            allowAll
            label="Outlet scope"
          />
        </div>
      </header>

      {error ? (
        <div className="inline-alert owner-error" role="alert">
          <span>{error}</span>
          <button
            className="secondary-button compact-button"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading && !dashboard ? (
        <div className="owner-loading" aria-live="polite">
          Loading business data…
        </div>
      ) : dashboard ? (
        <>
          <section className="owner-kpis" aria-label="Business summary">
            <article className="owner-kpi">
              <span>Paid sales</span>
              {dashboard.currencyTotals.length === 0 ? (
                <strong>—</strong>
              ) : (
                dashboard.currencyTotals.map((total) => (
                  <div className="owner-money-line" key={total.currency}>
                    <strong>
                      {formatMoney(total.netSales, total.currency)}
                    </strong>
                    <Change value={total.netSalesChangeBps} />
                  </div>
                ))
              )}
              <small>Compared with the previous matching period</small>
            </article>
            <article className="owner-kpi">
              <span>Completed orders</span>
              <div className="owner-money-line">
                <strong>
                  {formatNumber(dashboard.totals.completedOrders)}
                </strong>
                <Change value={dashboard.totals.completedOrdersChangeBps} />
              </div>
              <small>
                {formatNumber(dashboard.totals.activeQueue)} currently in queue
              </small>
            </article>
            <article className="owner-kpi">
              <span>Average paid order</span>
              {dashboard.currencyTotals.length === 0 ? (
                <strong>—</strong>
              ) : (
                dashboard.currencyTotals.map((total) => (
                  <strong key={total.currency}>
                    {formatMoney(total.averageOrderValue, total.currency)}
                  </strong>
                ))
              )}
              <small>Calculated from paid orders only</small>
            </article>
            <article className="owner-kpi owner-kpi-alert">
              <span>Needs attention</span>
              <strong>
                {formatNumber(
                  dashboard.totals.paymentAttention +
                    dashboard.totals.lowStock +
                    dashboard.totals.maintenanceDue,
                )}
              </strong>
              <small>
                {dashboard.totals.paymentAttention} payment ·{' '}
                {dashboard.totals.lowStock} stock ·{' '}
                {dashboard.totals.maintenanceDue} maintenance
              </small>
            </article>
          </section>

          <div className="owner-insights-grid">
            <section className="owner-panel owner-trend-panel">
              <div className="owner-panel-heading">
                <div>
                  <h2>Paid sales trend</h2>
                  <p>Recognized only when a payment is marked paid.</p>
                </div>
                {dashboard.currencyTotals.length > 1 ? (
                  <select
                    aria-label="Chart currency"
                    value={chartCurrency}
                    onChange={(event) => setChartCurrency(event.target.value)}
                  >
                    {dashboard.currencyTotals.map((total) => (
                      <option value={total.currency} key={total.currency}>
                        {total.currency}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              {chartCurrency ? (
                <OwnerSalesChart
                  trend={dashboard.trend}
                  currency={chartCurrency}
                />
              ) : (
                <div className="dashboard-chart-empty">
                  No currency data available.
                </div>
              )}
              {selectedTotal ? (
                <p className="owner-chart-caption">
                  {formatNumber(selectedTotal.paidOrders)} paid orders in{' '}
                  {chartCurrency}
                </p>
              ) : null}
            </section>

            <section className="owner-panel owner-attention-panel">
              <div className="owner-panel-heading">
                <div>
                  <h2>Needs attention</h2>
                  <p>Current operational records requiring review.</p>
                </div>
              </div>
              {dashboard.attention.length === 0 ? (
                <div className="owner-empty-list">
                  No current operational alerts.
                </div>
              ) : (
                <div className="owner-attention-list">
                  {dashboard.attention.slice(0, 7).map((item) => (
                    <article
                      className="owner-attention-row"
                      key={`${item.type}-${item.referenceId}`}
                    >
                      <span
                        className={`attention-dot ${item.severity.toLowerCase()}`}
                      />
                      <div>
                        <strong>{item.title}</strong>
                        <span>
                          {item.outletName} · {item.detail}
                        </span>
                      </div>
                      <time dateTime={item.occurredAt}>
                        {formatShortDate(item.occurredAt)}
                      </time>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="owner-panel owner-outlets-panel">
            <div className="owner-panel-heading outlet-table-heading">
              <div>
                <h2>Outlet performance</h2>
                <p>Sales and operational load for the selected period.</p>
              </div>
              <div className="outlet-table-actions">
                <input
                  aria-label="Search outlets"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search outlet"
                />
                <button
                  className="secondary-button compact-button"
                  onClick={() => exportOutlets(filteredOutlets, rangeDays)}
                  disabled={filteredOutlets.length === 0}
                >
                  Export CSV
                </button>
              </div>
            </div>

            {filteredOutlets.length === 0 ? (
              <div className="owner-empty-list">
                No outlets match this view.
              </div>
            ) : (
              <>
                <div className="owner-table-wrap">
                  <table className="owner-table">
                    <thead>
                      <tr>
                        <th>Outlet</th>
                        <th>Status</th>
                        <th>Paid sales</th>
                        <th>Paid orders</th>
                        <th>Average order</th>
                        <th>Active queue</th>
                        <th>Operational alerts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOutlets.map((outlet) => (
                        <tr key={outlet.id}>
                          <td>
                            <strong>{outlet.name}</strong>
                            <span>{outlet.id}</span>
                          </td>
                          <td>
                            <Status active={outlet.active} />
                          </td>
                          <td>
                            {formatMoney(outlet.netSales, outlet.currency)}
                          </td>
                          <td>{formatNumber(outlet.paidOrders)}</td>
                          <td>
                            {formatMoney(
                              outlet.averageOrderValue,
                              outlet.currency,
                            )}
                          </td>
                          <td>{formatNumber(outlet.activeQueue)}</td>
                          <td>{alertSummary(outlet)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="owner-outlet-mobile-list">
                  {filteredOutlets.map((outlet) => (
                    <article key={outlet.id}>
                      <div>
                        <strong>{outlet.name}</strong>
                        <Status active={outlet.active} />
                      </div>
                      <span>
                        {formatMoney(outlet.netSales, outlet.currency)} ·{' '}
                        {outlet.paidOrders} paid orders
                      </span>
                      <span>
                        {outlet.activeQueue} active queue ·{' '}
                        {alertSummary(outlet)}
                      </span>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <p className="owner-generated">
            Updated{' '}
            {new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(dashboard.generatedAt))}
          </p>
        </>
      ) : null}
    </StaffShell>
  );
}

function Change({ value }: { value: number | null }) {
  if (value == null) return <span className="owner-change neutral">New</span>;
  const percent = value / 100;
  return (
    <span
      className={`owner-change ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}`}
    >
      {value > 0 ? '+' : ''}
      {percent.toFixed(1)}%
    </span>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span className={`owner-status ${active ? 'active' : 'inactive'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function alertSummary(outlet: OwnerDashboardOutletPerformance) {
  const count =
    outlet.paymentAttention + outlet.lowStock + outlet.maintenanceDue;
  if (count === 0) return 'No alerts';
  return `${count} alert${count === 1 ? '' : 's'}`;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function exportOutlets(
  outlets: OwnerDashboardOutletPerformance[],
  rangeDays: number,
) {
  const rows = [
    [
      'Outlet',
      'Status',
      'Currency',
      'Paid sales',
      'Paid orders',
      'Completed orders',
      'Average order',
      'Active queue',
      'Payment attention',
      'Low stock',
      'Maintenance due',
    ],
    ...outlets.map((outlet) => [
      outlet.name,
      outlet.active ? 'Active' : 'Inactive',
      outlet.currency,
      outlet.netSales,
      outlet.paidOrders,
      outlet.completedOrders,
      outlet.averageOrderValue,
      outlet.activeQueue,
      outlet.paymentAttention,
      outlet.lowStock,
      outlet.maintenanceDue,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `fusionify-outlets-${rangeDays}-days.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
