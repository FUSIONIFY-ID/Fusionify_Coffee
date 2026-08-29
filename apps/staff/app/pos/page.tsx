'use client';

import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type {
  StaffCatalog,
  StaffCatalogProduct,
  StaffOrder,
  StaffPaymentView,
} from '@/lib/types';

type CartLine = {
  key: string;
  product: StaffCatalogProduct;
  quantity: number;
  modifierOptionIds: string[];
  modifierLabels: string[];
  unitEstimate: number;
};

export default function PosPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [catalog, setCatalog] = useState<StaffCatalog | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [selectedProduct, setSelectedProduct] =
    useState<StaffCatalogProduct | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<StaffOrder | null>(null);
  const [payment, setPayment] = useState<StaffPaymentView | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!staff) return;
    apiJson<StaffCatalog>('/api/catalog?lang=EN')
      .then((data) => {
        setCatalog(data);
        setCatalogError('');
      })
      .catch((cause) => {
        setCatalogError(
          cause instanceof Error ? cause.message : 'Catalog could not load.',
        );
      });
  }, [staff]);

  useEffect(() => {
    if (!payment?.qrString) {
      setQrDataUrl('');
      return;
    }

    let active = true;
    QRCode.toDataURL(payment.qrString, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then((value) => {
        if (active) setQrDataUrl(value);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [payment?.qrString]);

  useEffect(() => {
    if (!order || order.status !== 'AWAITING_PAYMENT') return;

    const timer = window.setInterval(() => {
      void apiJson<StaffOrder>(`/api/staff/orders/${order.id}`)
        .then((latest) => {
          setOrder(latest);
          if (latest.status === 'CONFIRMED') {
            setCart([]);
          }
        })
        .catch(() => {});
    }, 3_000);

    return () => window.clearInterval(timer);
  }, [order]);

  const categories = useMemo(() => {
    if (!catalog) return [];
    return Array.from(new Set(catalog.products.map((product) => product.category)));
  }, [catalog]);

  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitEstimate * line.quantity,
    0,
  );

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening POS…</main>;
  }

  if (!staff.permissions.includes('orders.manage')) {
    return (
      <StaffShell staff={staff}>
        <div className="empty-panel">You do not have POS order access.</div>
      </StaffShell>
    );
  }

  function configure(product: StaffCatalogProduct) {
    const defaults: Record<string, string[]> = {};
    for (const group of product.modifierGroups) {
      const selected = group.options.filter((option) => option.isDefault);
      defaults[group.id] = selected.map((option) => option.id);
    }
    setSelectedProduct(product);
    setSelectedOptions(defaults);
    setQuantity(1);
    setError('');
  }

  function chooseSingle(groupId: string, optionId: string) {
    setSelectedOptions((current) => ({
      ...current,
      [groupId]: [optionId],
    }));
  }

  function toggleMultiple(groupId: string, optionId: string) {
    setSelectedOptions((current) => {
      const values = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: values.includes(optionId)
          ? values.filter((value) => value !== optionId)
          : [...values, optionId],
      };
    });
  }

  function addConfiguredProduct() {
    const product = selectedProduct;
    if (!product) return;

    for (const group of product.modifierGroups) {
      if (group.required && (selectedOptions[group.id]?.length ?? 0) === 0) {
        setError(`${group.label} is required.`);
        return;
      }
    }

    const modifierOptionIds = Object.values(selectedOptions).flat().sort();
    const selected = product.modifierGroups.flatMap((group) =>
      group.options.filter((option) => modifierOptionIds.includes(option.id)),
    );
    const modifierLabels = selected.map((option) => option.label);
    const unitEstimate =
      product.basePrice +
      selected.reduce((sum, option) => sum + option.priceDelta, 0);
    const key = [product.id, ...modifierOptionIds].join('|');

    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [
        ...current,
        {
          key,
          product,
          quantity,
          modifierOptionIds,
          modifierLabels,
          unitEstimate,
        },
      ];
    });
    setSelectedProduct(null);
    setError('');
  }

  async function createOrderAndPayment() {
    if (!catalog || cart.length === 0 || busy) return;
    setBusy(true);
    setError('');

    try {
      const createdOrder =
        order ??
        (await apiJson<StaffOrder>('/api/staff/orders', {
          method: 'POST',
          headers: {
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({
            outletId: catalog.outlet.id,
            items: cart.map((line) => ({
              productId: line.product.id,
              quantity: line.quantity,
              modifierOptionIds: line.modifierOptionIds,
            })),
          }),
        }));

      setOrder(createdOrder);

      const createdPayment = await apiJson<StaffPaymentView>(
        `/api/staff/orders/${createdOrder.id}/payments`,
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({ channel: 'GOPAY_QRIS' }),
        },
      );
      setPayment(createdPayment);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Order or QRIS payment could not be created.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function checkPayment() {
    if (!payment) return;
    setBusy(true);
    setError('');
    try {
      const next = await apiJson<StaffPaymentView>(
        `/api/staff/payments/${payment.id}/check`,
        { method: 'POST' },
      );
      setPayment(next);
      if (order) {
        setOrder(await apiJson<StaffOrder>(`/api/staff/orders/${order.id}`));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Status check failed.');
    } finally {
      setBusy(false);
    }
  }

  function resetSale() {
    setCart([]);
    setOrder(null);
    setPayment(null);
    setQrDataUrl('');
    setSelectedProduct(null);
    setError('');
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">COUNTER ORDER</p>
          <h1>Point of sale</h1>
          <p>
            Build a walk-in order. Final pricing is calculated again by the
            Fusionify API before QRIS is created.
          </p>
        </div>
        {order?.status === 'CONFIRMED' ? (
          <button className="primary-button compact-button" onClick={resetSale}>
            New sale
          </button>
        ) : null}
      </header>

      {catalogError ? <div className="inline-alert">{catalogError}</div> : null}
      {error ? <div className="inline-alert">{error}</div> : null}

      {order?.status === 'CONFIRMED' ? (
        <section className="pos-success">
          <span>Payment received</span>
          <h2>Order #{shortId(order.id)} is now in KDS</h2>
          <p>The kitchen queue will handle the fulfillment sequence.</p>
        </section>
      ) : (
        <div className="pos-layout">
          <section className="pos-catalog">
            {catalog ? (
              categories.map((category) => (
                <div className="pos-category" key={category}>
                  <h2>{category}</h2>
                  <div className="product-grid">
                    {catalog.products
                      .filter((product) => product.category === category)
                      .map((product) => (
                        <button
                          className="pos-product"
                          key={product.id}
                          type="button"
                          onClick={() => configure(product)}
                        >
                          <span>{product.name}</span>
                          <small>{product.description}</small>
                          <strong>{formatMoney(product.basePrice)}</strong>
                        </button>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-panel">Loading menu…</div>
            )}
          </section>

          <aside className="pos-side">
            {selectedProduct ? (
              <section className="pos-config">
                <button
                  className="text-button pos-back"
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                >
                  ← Back to cart
                </button>
                <p className="eyebrow">CUSTOMIZE</p>
                <h2>{selectedProduct.name}</h2>

                {selectedProduct.modifierGroups.map((group) => (
                  <fieldset className="modifier-fieldset" key={group.id}>
                    <legend>
                      {group.label}
                      {group.required ? <small>Required</small> : null}
                    </legend>
                    <div className="modifier-options">
                      {group.options.map((option) => {
                        const checked = (
                          selectedOptions[group.id] ?? []
                        ).includes(option.id);
                        return (
                          <label key={option.id}>
                            <input
                              type={group.allowMultiple ? 'checkbox' : 'radio'}
                              name={group.id}
                              checked={checked}
                              onChange={() =>
                                group.allowMultiple
                                  ? toggleMultiple(group.id, option.id)
                                  : chooseSingle(group.id, option.id)
                              }
                            />
                            <span>{option.label}</span>
                            <small>
                              {option.priceDelta > 0
                                ? `+${formatMoney(option.priceDelta)}`
                                : 'Included'}
                            </small>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}

                <div className="quantity-row">
                  <span>Quantity</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    >
                      −
                    </button>
                    <strong>{quantity}</strong>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => value + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button className="primary-button" onClick={addConfiguredProduct}>
                  Add to order
                </button>
              </section>
            ) : payment ? (
              <section className="pos-payment">
                <p className="eyebrow">GOPAY QRIS</p>
                <h2>{formatMoney(payment.amount)}</h2>
                <p className="muted">Status: {payment.status}</p>
                {qrDataUrl ? (
                  <img
                    className="pos-qr"
                    src={qrDataUrl}
                    alt="GoPay QRIS payment code"
                  />
                ) : (
                  <div className="empty-panel compact-empty">
                    QR payload received, but visual rendering failed.
                  </div>
                )}
                <button
                  className="secondary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void checkPayment()}
                >
                  {busy ? 'Checking…' : 'Check payment'}
                </button>
              </section>
            ) : (
              <section className="pos-cart">
                <p className="eyebrow">CURRENT SALE</p>
                <h2>Cart</h2>
                <div className="pos-cart-lines">
                  {cart.map((line) => (
                    <div className="pos-cart-line" key={line.key}>
                      <div>
                        <strong>
                          {line.quantity}× {line.product.name}
                        </strong>
                        {line.modifierLabels.length ? (
                          <small>{line.modifierLabels.join(' • ')}</small>
                        ) : null}
                      </div>
                      <span>
                        {formatMoney(line.unitEstimate * line.quantity)}
                      </span>
                    </div>
                  ))}
                  {cart.length === 0 ? (
                    <p className="muted">Select a product to start an order.</p>
                  ) : null}
                </div>
                <div className="pos-total">
                  <span>Estimated subtotal</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>
                <p className="pos-authority-note">
                  The API recalculates the authoritative total from active menu
                  and modifier records.
                </p>
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy || cart.length === 0}
                  onClick={() => void createOrderAndPayment()}
                >
                  {busy
                    ? 'Creating payment…'
                    : order
                      ? 'Retry QRIS payment'
                      : 'Create QRIS payment'}
                </button>
              </section>
            )}
          </aside>
        </div>
      )}
    </StaffShell>
  );
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
