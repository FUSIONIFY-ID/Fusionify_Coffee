'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type { StaffOrder } from '@/lib/types';

const lanes = [
  { status: 'CONFIRMED', label: 'New', action: 'PREPARING', actionLabel: 'Start' },
  {
    status: 'PREPARING',
    label: 'Preparing',
    action: 'READY',
    actionLabel: 'Mark ready',
  },
  {
    status: 'READY',
    label: 'Ready',
    action: 'PICKED_UP',
    actionLabel: 'Picked up',
  },
  {
    status: 'PICKED_UP',
    label: 'Handoff',
    action: 'COMPLETED',
    actionLabel: 'Complete',
  },
] as const;

export default function KdsPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiJson<StaffOrder[]>('/api/staff/orders');
      setOrders(
        data.filter((order) =>
          lanes.some((lane) => lane.status === order.status),
        ),
      );
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Queue could not load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!staff) return;
    void loadOrders();
    const timer = window.setInterval(() => void loadOrders(), 10_000);
    return () => window.clearInterval(timer);
  }, [staff, loadOrders]);

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        lanes.map((lane) => [
          lane.status,
          orders.filter((order) => order.status === lane.status),
        ]),
      ) as Record<string, StaffOrder[]>,
    [orders],
  );

  async function transition(order: StaffOrder, toStatus: string) {
    setActingId(order.id);
    try {
      await apiJson<StaffOrder>(`/api/staff/orders/${order.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ toStatus }),
      });
      await loadOrders();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Status update failed.');
    } finally {
      setActingId('');
    }
  }

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening staff workspace…</main>;
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">LIVE OUTLET QUEUE</p>
          <h1>Kitchen & pickup</h1>
          <p>
            {staff.outletId
              ? 'Showing orders assigned to your outlet.'
              : 'Showing operational orders across permitted outlets.'}
          </p>
        </div>
        <button
          className="secondary-button compact-button"
          type="button"
          onClick={() => void loadOrders()}
        >
          Refresh
        </button>
      </header>

      {error ? <div className="inline-alert">{error}</div> : null}

      {loading ? (
        <div className="empty-panel">Loading order queue…</div>
      ) : (
        <div className="kds-board">
          {lanes.map((lane) => (
            <section className="kds-lane" key={lane.status}>
              <header>
                <div>
                  <h2>{lane.label}</h2>
                  <span>{grouped[lane.status]?.length ?? 0} orders</span>
                </div>
                <span className="lane-dot" aria-hidden="true" />
              </header>

              <div className="lane-stack">
                {(grouped[lane.status] ?? []).map((order) => (
                  <article className="order-ticket" key={order.id}>
                    <div className="ticket-topline">
                      <strong>#{shortId(order.id)}</strong>
                      <time>{formatTime(order.createdAt)}</time>
                    </div>
                    <div className="ticket-items">
                      {order.items.map((item) => (
                        <div key={item.id}>
                          <strong>{item.quantity}×</strong>
                          <span>{item.productName}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ticket-footer">
                      <Link href={`/orders/${order.id}`}>Details</Link>
                      <button
                        type="button"
                        className="primary-button ticket-action"
                        disabled={actingId === order.id}
                        onClick={() => void transition(order, lane.action)}
                      >
                        {actingId === order.id ? 'Updating…' : lane.actionLabel}
                      </button>
                    </div>
                  </article>
                ))}

                {(grouped[lane.status] ?? []).length === 0 ? (
                  <div className="lane-empty">No orders</div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </StaffShell>
  );
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
