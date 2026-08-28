'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type { StaffOrder } from '@/lib/types';

const nextStatus: Record<string, { status: string; label: string }> = {
  CONFIRMED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'READY', label: 'Mark ready' },
  READY: { status: 'PICKED_UP', label: 'Confirm pickup' },
  PICKED_UP: { status: 'COMPLETED', label: 'Complete order' },
};

export default function StaffOrderDetailPage() {
  const { staff, loading: staffLoading } = useStaff();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<StaffOrder | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await apiJson<StaffOrder>(`/api/staff/orders/${orderId}`));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Order could not load.');
    }
  }, [orderId]);

  useEffect(() => {
    if (staff) void load();
  }, [staff, load]);

  const action = useMemo(
    () => (order ? nextStatus[order.status] : undefined),
    [order],
  );

  async function advance() {
    if (!order || !action) return;
    setBusy(true);
    try {
      const updated = await apiJson<StaffOrder>(
        `/api/staff/orders/${order.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ toStatus: action.status }),
        },
      );
      setOrder(updated);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Status update failed.');
    } finally {
      setBusy(false);
    }
  }

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening order…</main>;
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <Link className="back-link" href="/kds">
            ← Queue
          </Link>
          <p className="eyebrow">ORDER DETAIL</p>
          <h1>{order ? `#${shortId(order.id)}` : 'Order'}</h1>
        </div>
      </header>

      {error ? <div className="inline-alert">{error}</div> : null}

      {!order ? (
        <div className="empty-panel">Loading order…</div>
      ) : (
        <div className="order-detail-grid">
          <section className="detail-card">
            <div className="detail-title-row">
              <div>
                <span className="status-label">{prettyStatus(order.status)}</span>
                <h2>{order.outlet.name}</h2>
              </div>
              <strong className="order-total">
                {formatMoney(order.totalAmount)}
              </strong>
            </div>

            <div className="detail-items">
              {order.items.map((item) => (
                <div className="detail-item" key={item.id}>
                  <strong>{item.quantity}×</strong>
                  <div>
                    <span>{item.productName}</span>
                    {item.selectedModifiers?.length ? (
                      <small>
                        {item.selectedModifiers
                          .map((modifier) => modifier.optionName)
                          .join(' • ')}
                      </small>
                    ) : null}
                  </div>
                  <span>{formatMoney(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            {action ? (
              <button
                className="primary-button"
                type="button"
                disabled={busy}
                onClick={() => void advance()}
              >
                {busy ? 'Updating…' : action.label}
              </button>
            ) : null}
          </section>

          <section className="detail-card">
            <p className="eyebrow">FULFILLMENT LOG</p>
            <h2>Timeline</h2>
            <div className="timeline">
              {(order.statusEvents ?? []).map((event) => (
                <div className="timeline-row" key={event.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{prettyStatus(event.toStatus)}</strong>
                    <small>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(event.createdAt))}
                    </small>
                    {event.staffUser ? (
                      <small>by {event.staffUser.fullName}</small>
                    ) : null}
                    {event.note ? <p>{event.note}</p> : null}
                  </div>
                </div>
              ))}
              {(order.statusEvents ?? []).length === 0 ? (
                <p className="muted">No status events recorded yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </StaffShell>
  );
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
}

function prettyStatus(status: string) {
  const value = status.replaceAll('_', ' ').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
