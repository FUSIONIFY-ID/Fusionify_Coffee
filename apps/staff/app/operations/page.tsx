'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type {
  InventoryItem,
  OutletInventoryLevel,
  PurchaseOrder,
  StaffAsset,
  Supplier,
} from '@/lib/types';

export default function OperationsPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [outletId, setOutletId] = useState('');
  const [inventory, setInventory] = useState<OutletInventoryLevel[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [assets, setAssets] = useState<StaffAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [itemSku, setItemSku] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<'INGREDIENT' | 'PACKAGING' | 'SUPPLY'>(
    'INGREDIENT',
  );
  const [itemUnit, setItemUnit] = useState('');
  const [itemCost, setItemCost] = useState('0');

  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItemId, setPoItemId] = useState('');
  const [poQuantity, setPoQuantity] = useState('');
  const [poUnitCost, setPoUnitCost] = useState('');
  const [poCurrency, setPoCurrency] = useState('IDR');
  const [poNotes, setPoNotes] = useState('');

  const [assetTag, setAssetTag] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('');

  const canRead = staff?.permissions.includes('inventory.read') ?? false;
  const canManage = staff?.permissions.includes('inventory.manage') ?? false;
  const effectiveOutletId = staff?.outletId ?? outletId.trim();

  useEffect(() => {
    if (staff?.outletId) setOutletId(staff.outletId);
  }, [staff?.outletId]);

  const outletQuery = useMemo(() => {
    if (!effectiveOutletId) return '';
    return `?outletId=${encodeURIComponent(effectiveOutletId)}`;
  }, [effectiveOutletId]);

  const load = useCallback(async () => {
    if (!canRead) return;
    if (!effectiveOutletId) {
      setError('Select an outlet before loading operations data.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [nextInventory, nextItems, nextSuppliers, nextPurchaseOrders, nextAssets] =
        await Promise.all([
          apiJson<OutletInventoryLevel[]>(`/api/staff/operations/inventory${outletQuery}`),
          apiJson<InventoryItem[]>('/api/staff/operations/inventory/items'),
          apiJson<Supplier[]>('/api/staff/operations/suppliers'),
          apiJson<PurchaseOrder[]>(
            `/api/staff/operations/purchase-orders${outletQuery}`,
          ),
          apiJson<StaffAsset[]>(`/api/staff/operations/assets${outletQuery}`),
        ]);
      setInventory(nextInventory);
      setItems(nextItems);
      setSuppliers(nextSuppliers);
      setPurchaseOrders(nextPurchaseOrders);
      setAssets(nextAssets);
      setAdjustItemId((current) => current || nextItems[0]?.id || '');
      setPoItemId((current) => current || nextItems[0]?.id || '');
      setPoSupplierId((current) => current || nextSuppliers[0]?.id || '');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Operations data could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [canRead, effectiveOutletId, outletQuery]);

  useEffect(() => {
    if (staff && canRead && effectiveOutletId) void load();
  }, [staff, canRead, effectiveOutletId, load]);

  async function runMutation(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Operation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function saveInventoryItem(event: FormEvent) {
    event.preventDefault();
    const sku = itemSku.trim().toUpperCase();
    const costPerBaseUnit = Number.parseInt(itemCost, 10);
    if (!sku || !itemName.trim() || !itemUnit.trim()) {
      setError('SKU, name, and base unit are required.');
      return;
    }
    if (!Number.isInteger(costPerBaseUnit) || costPerBaseUnit < 0) {
      setError('Cost per base unit must be a non-negative integer.');
      return;
    }

    await runMutation(
      () =>
        apiJson(`/api/staff/operations/inventory/items/${encodeURIComponent(sku)}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: itemName.trim(),
            type: itemType,
            baseUnit: itemUnit.trim(),
            costPerBaseUnit,
            active: true,
          }),
        }),
      `${sku} saved.`,
    );
  }

  async function adjustStock(event: FormEvent) {
    event.preventDefault();
    const quantityBaseUnit = Number.parseInt(adjustQuantity, 10);
    if (!adjustItemId || !Number.isInteger(quantityBaseUnit) || quantityBaseUnit === 0) {
      setError('Choose an inventory item and enter a non-zero quantity.');
      return;
    }

    await runMutation(
      () =>
        apiJson('/api/staff/operations/inventory/adjust', {
          method: 'POST',
          body: JSON.stringify({
            outletId: effectiveOutletId,
            inventoryItemId: adjustItemId,
            type: 'ADJUSTMENT',
            quantityBaseUnit,
            reason: adjustReason.trim() || undefined,
          }),
        }),
      'Stock adjustment saved.',
    );
    setAdjustQuantity('');
    setAdjustReason('');
  }

  async function createSupplier(event: FormEvent) {
    event.preventDefault();
    if (!supplierName.trim()) {
      setError('Supplier name is required.');
      return;
    }

    await runMutation(
      () =>
        apiJson('/api/staff/operations/suppliers', {
          method: 'POST',
          body: JSON.stringify({
            name: supplierName.trim(),
            contactName: supplierContact.trim() || undefined,
            phone: supplierPhone.trim() || undefined,
            email: supplierEmail.trim() || undefined,
          }),
        }),
      'Supplier created.',
    );
    setSupplierName('');
    setSupplierContact('');
    setSupplierPhone('');
    setSupplierEmail('');
  }

  async function createPurchaseOrder(event: FormEvent) {
    event.preventDefault();
    const quantityBaseUnit = Number.parseInt(poQuantity, 10);
    const unitCost = Number.parseInt(poUnitCost, 10);
    const currency = poCurrency.trim().toUpperCase();

    if (!poSupplierId || !poItemId) {
      setError('Supplier and inventory item are required.');
      return;
    }
    if (!Number.isInteger(quantityBaseUnit) || quantityBaseUnit <= 0) {
      setError('Purchase quantity must be a positive integer.');
      return;
    }
    if (!Number.isInteger(unitCost) || unitCost < 0) {
      setError('Unit cost must be a non-negative integer.');
      return;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      setError('Currency must be a 3-letter code such as IDR or MYR.');
      return;
    }

    await runMutation(
      () =>
        apiJson('/api/staff/operations/purchase-orders', {
          method: 'POST',
          body: JSON.stringify({
            outletId: effectiveOutletId,
            supplierId: poSupplierId,
            currency,
            notes: poNotes.trim() || undefined,
            items: [
              {
                inventoryItemId: poItemId,
                quantityBaseUnit,
                unitCost,
              },
            ],
          }),
        }),
      'Purchase order created as draft.',
    );
    setPoQuantity('');
    setPoUnitCost('');
    setPoNotes('');
  }

  async function markOrdered(order: PurchaseOrder) {
    await runMutation(
      () =>
        apiJson(`/api/staff/operations/purchase-orders/${order.id}/order`, {
          method: 'POST',
        }),
      'Purchase order marked as ordered.',
    );
  }

  async function receiveRemaining(order: PurchaseOrder) {
    const remaining = order.items
      .map((item) => ({
        inventoryItemId: item.inventoryItemId,
        quantityBaseUnit: Math.max(0, item.quantityBaseUnit - item.receivedBaseUnit),
      }))
      .filter((item) => item.quantityBaseUnit > 0);

    if (remaining.length === 0) {
      setError('This purchase order has no remaining quantity to receive.');
      return;
    }

    await runMutation(
      () =>
        apiJson(`/api/staff/operations/purchase-orders/${order.id}/receive`, {
          method: 'POST',
          body: JSON.stringify({ items: remaining }),
        }),
      'Remaining purchase order stock received.',
    );
  }

  async function createAsset(event: FormEvent) {
    event.preventDefault();
    if (!assetTag.trim() || !assetName.trim() || !assetCategory.trim()) {
      setError('Asset tag, name, and category are required.');
      return;
    }

    await runMutation(
      () =>
        apiJson('/api/staff/operations/assets', {
          method: 'POST',
          body: JSON.stringify({
            outletId: effectiveOutletId,
            assetTag: assetTag.trim().toUpperCase(),
            name: assetName.trim(),
            category: assetCategory.trim(),
            status: 'ACTIVE',
          }),
        }),
      'Asset created.',
    );
    setAssetTag('');
    setAssetName('');
    setAssetCategory('');
  }

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening operations…</main>;
  }

  if (!canRead) {
    return (
      <StaffShell staff={staff}>
        <div className="empty-panel">You do not have inventory access.</div>
      </StaffShell>
    );
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">OUTLET OPERATIONS</p>
          <h1>Inventory, Purchasing & Assets</h1>
          <p>
            Work from actual outlet stock and procurement records. Every mutation
            stays behind staff RBAC and backend audit controls.
          </p>
        </div>
      </header>

      {!staff.outletId ? (
        <section className="detail-card">
          <p className="eyebrow">OUTLET SCOPE</p>
          <h2>Select outlet</h2>
          <div className="form-stack">
            <label>
              Outlet ID
              <input
                value={outletId}
                onChange={(event) => setOutletId(event.target.value)}
                placeholder="Outlet ID"
              />
            </label>
            <button className="primary-button" type="button" onClick={() => void load()}>
              Load outlet operations
            </button>
          </div>
        </section>
      ) : null}

      {error ? <div className="inline-alert">{error}</div> : null}
      {message ? <div className="detail-card">{message}</div> : null}
      {loading ? <div className="detail-card">Loading outlet operations…</div> : null}

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">STOCK ON HAND</p>
          <h2>{inventory.length} inventory balances</h2>
          <div className="team-list">
            {inventory.length === 0 ? (
              <p>No outlet stock records yet.</p>
            ) : (
              inventory.map((level) => (
                <article className="team-row" key={level.id}>
                  <div className="team-avatar">{level.inventoryItem.sku.slice(0, 3)}</div>
                  <div className="team-name">
                    <strong>{level.inventoryItem.name}</strong>
                    <span>
                      {level.inventoryItem.type.replaceAll('_', ' ')} · {level.inventoryItem.baseUnit}
                    </span>
                  </div>
                  <span className="team-role">
                    {level.onHandBaseUnit} {level.inventoryItem.baseUnit}
                  </span>
                </article>
              ))
            )}
          </div>
        </section>

        {canManage ? (
          <section className="detail-card">
            <p className="eyebrow">STOCK ADJUSTMENT</p>
            <h2>Record an audited adjustment</h2>
            <form className="form-stack" onSubmit={adjustStock}>
              <label>
                Inventory item
                <select value={adjustItemId} onChange={(event) => setAdjustItemId(event.target.value)}>
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.sku} · {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity change
                <input
                  required
                  type="number"
                  step="1"
                  value={adjustQuantity}
                  onChange={(event) => setAdjustQuantity(event.target.value)}
                  placeholder="Use a negative number to reduce stock"
                />
              </label>
              <label>
                Reason
                <input
                  maxLength={240}
                  value={adjustReason}
                  onChange={(event) => setAdjustReason(event.target.value)}
                  placeholder="Stock count correction"
                />
              </label>
              <button className="primary-button" disabled={busy || !effectiveOutletId}>
                Save stock adjustment
              </button>
            </form>
          </section>
        ) : null}
      </div>

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">INVENTORY MASTER</p>
          <h2>{items.length} inventory items</h2>
          <div className="team-list">
            {items.map((item) => (
              <article className="team-row" key={item.id}>
                <div className="team-avatar">{item.sku.slice(0, 3)}</div>
                <div className="team-name">
                  <strong>{item.name}</strong>
                  <span>{item.sku} · {item.baseUnit}</span>
                </div>
                <span className="team-role">{item.active ? item.type : 'INACTIVE'}</span>
              </article>
            ))}
          </div>
        </section>

        {canManage ? (
          <section className="detail-card">
            <p className="eyebrow">INVENTORY ITEM</p>
            <h2>Create or update by SKU</h2>
            <form className="form-stack" onSubmit={saveInventoryItem}>
              <label>
                SKU
                <input required maxLength={40} value={itemSku} onChange={(event) => setItemSku(event.target.value.toUpperCase())} />
              </label>
              <label>
                Name
                <input required maxLength={100} value={itemName} onChange={(event) => setItemName(event.target.value)} />
              </label>
              <label>
                Type
                <select value={itemType} onChange={(event) => setItemType(event.target.value as typeof itemType)}>
                  <option value="INGREDIENT">Ingredient</option>
                  <option value="PACKAGING">Packaging</option>
                  <option value="SUPPLY">Supply</option>
                </select>
              </label>
              <label>
                Base unit
                <input required maxLength={24} value={itemUnit} onChange={(event) => setItemUnit(event.target.value)} placeholder="ml, gram, pcs" />
              </label>
              <label>
                Cost per base unit
                <input required min={0} type="number" value={itemCost} onChange={(event) => setItemCost(event.target.value)} />
              </label>
              <button className="primary-button" disabled={busy}>Save inventory item</button>
            </form>
          </section>
        ) : null}
      </div>

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">SUPPLIERS</p>
          <h2>{suppliers.length} suppliers</h2>
          <div className="team-list">
            {suppliers.length === 0 ? (
              <p>No suppliers configured yet.</p>
            ) : (
              suppliers.map((supplier) => (
                <article className="team-row" key={supplier.id}>
                  <div className="team-avatar">{supplier.name.slice(0, 2).toUpperCase()}</div>
                  <div className="team-name">
                    <strong>{supplier.name}</strong>
                    <span>{supplier.contactName || supplier.email || supplier.phone || 'No contact details'}</span>
                  </div>
                  <span className="team-role">{supplier.active ? 'ACTIVE' : 'INACTIVE'}</span>
                </article>
              ))
            )}
          </div>
        </section>

        {canManage ? (
          <section className="detail-card">
            <p className="eyebrow">NEW SUPPLIER</p>
            <h2>Supplier contact</h2>
            <form className="form-stack" onSubmit={createSupplier}>
              <label>Name<input required value={supplierName} onChange={(event) => setSupplierName(event.target.value)} /></label>
              <label>Contact name<input value={supplierContact} onChange={(event) => setSupplierContact(event.target.value)} /></label>
              <label>Phone<input value={supplierPhone} onChange={(event) => setSupplierPhone(event.target.value)} /></label>
              <label>Email<input type="email" value={supplierEmail} onChange={(event) => setSupplierEmail(event.target.value)} /></label>
              <button className="primary-button" disabled={busy}>Create supplier</button>
            </form>
          </section>
        ) : null}
      </div>

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">PURCHASE ORDERS</p>
          <h2>{purchaseOrders.length} recent purchase orders</h2>
          <div className="team-list">
            {purchaseOrders.length === 0 ? (
              <p>No purchase orders yet.</p>
            ) : (
              purchaseOrders.map((order) => (
                <article className="team-row" key={order.id}>
                  <div className="team-avatar">PO</div>
                  <div className="team-name">
                    <strong>{order.supplier.name}</strong>
                    <span>{order.items.length} line(s) · {order.currency}</span>
                  </div>
                  <span className="team-role">{order.status.replaceAll('_', ' ')}</span>
                  {canManage && order.status === 'DRAFT' ? (
                    <button className="text-button" type="button" onClick={() => void markOrdered(order)}>Mark ordered</button>
                  ) : null}
                  {canManage && (order.status === 'ORDERED' || order.status === 'PARTIALLY_RECEIVED') ? (
                    <button className="text-button" type="button" onClick={() => void receiveRemaining(order)}>Receive remaining</button>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        {canManage ? (
          <section className="detail-card">
            <p className="eyebrow">NEW PURCHASE ORDER</p>
            <h2>Single-line purchase order</h2>
            <p>Add more lines through subsequent procurement UI expansion; this form writes a real draft purchase order.</p>
            <form className="form-stack" onSubmit={createPurchaseOrder}>
              <label>
                Supplier
                <select value={poSupplierId} onChange={(event) => setPoSupplierId(event.target.value)}>
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}
                </select>
              </label>
              <label>
                Inventory item
                <select value={poItemId} onChange={(event) => setPoItemId(event.target.value)}>
                  <option value="">Select item</option>
                  {items.map((item) => <option value={item.id} key={item.id}>{item.sku} · {item.name}</option>)}
                </select>
              </label>
              <label>Quantity<input required min={1} type="number" value={poQuantity} onChange={(event) => setPoQuantity(event.target.value)} /></label>
              <label>Unit cost<input required min={0} type="number" value={poUnitCost} onChange={(event) => setPoUnitCost(event.target.value)} /></label>
              <label>Currency<input required maxLength={3} value={poCurrency} onChange={(event) => setPoCurrency(event.target.value.toUpperCase())} /></label>
              <label>Notes<input maxLength={500} value={poNotes} onChange={(event) => setPoNotes(event.target.value)} /></label>
              <button className="primary-button" disabled={busy || !effectiveOutletId}>Create draft PO</button>
            </form>
          </section>
        ) : null}
      </div>

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">ASSETS</p>
          <h2>{assets.length} outlet assets</h2>
          <div className="team-list">
            {assets.length === 0 ? (
              <p>No assets registered yet.</p>
            ) : (
              assets.map((asset) => (
                <article className="team-row" key={asset.id}>
                  <div className="team-avatar">{asset.assetTag.slice(0, 2)}</div>
                  <div className="team-name">
                    <strong>{asset.name}</strong>
                    <span>{asset.assetTag} · {asset.category}</span>
                  </div>
                  <span className="team-role">{asset.status}</span>
                </article>
              ))
            )}
          </div>
        </section>

        {canManage ? (
          <section className="detail-card">
            <p className="eyebrow">REGISTER ASSET</p>
            <h2>Add outlet equipment</h2>
            <form className="form-stack" onSubmit={createAsset}>
              <label>Asset tag<input required value={assetTag} onChange={(event) => setAssetTag(event.target.value.toUpperCase())} /></label>
              <label>Name<input required value={assetName} onChange={(event) => setAssetName(event.target.value)} /></label>
              <label>Category<input required value={assetCategory} onChange={(event) => setAssetCategory(event.target.value)} placeholder="Coffee machine" /></label>
              <button className="primary-button" disabled={busy || !effectiveOutletId}>Register asset</button>
            </form>
          </section>
        ) : null}
      </div>
    </StaffShell>
  );
}
