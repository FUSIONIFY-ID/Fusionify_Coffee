'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { CatalogModifierEditor } from '@/components/catalog-modifier-editor';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type {
  CatalogAdminCampaign,
  CatalogAdminCategory,
  CatalogAdminOutlet,
  CatalogAdminOverview,
  CatalogAdminProduct,
} from '@/lib/types';

const emptyOutlet: CatalogAdminOutlet = {
  id: '',
  name: '',
  note: '',
  imageUrl: '',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  active: true,
  sortOrder: 0,
  pickupEnabled: true,
  deliveryEnabled: false,
  latitude: null,
  longitude: null,
  deliveryRadiusMeters: null,
  deliveryBaseFee: 0,
  deliveryPerKmFee: 0,
};

const emptyCategory: CatalogAdminCategory = { id: '', name: '', sortOrder: 0 };

const emptyProduct: CatalogAdminProduct = {
  id: '',
  name: '',
  description: '',
  imageUrl: '',
  basePrice: 0,
  categoryId: '',
  category: { id: '', name: '' },
  active: true,
  isBestseller: false,
  modifierGroups: [],
  outletAvailability: [],
};

const emptyCampaign: CatalogAdminCampaign = {
  id: '',
  title: '',
  body: '',
  ctaLabel: '',
  imageUrl: '',
  actionPath: '/menu',
  active: true,
  sortOrder: 0,
};

export default function CatalogPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [overview, setOverview] = useState<CatalogAdminOverview | null>(null);
  const [outlet, setOutlet] = useState<CatalogAdminOutlet>(emptyOutlet);
  const [category, setCategory] = useState<CatalogAdminCategory>(emptyCategory);
  const [product, setProduct] = useState<CatalogAdminProduct>(emptyProduct);
  const [campaign, setCampaign] = useState<CatalogAdminCampaign>(emptyCampaign);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const next = await apiJson<CatalogAdminOverview>('/api/staff/catalog');
      setOverview(next);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Catalog could not load.',
      );
    }
  }, []);

  useEffect(() => {
    if (staff?.permissions.includes('catalog.manage')) void load();
  }, [staff, load]);

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening catalog…</main>;
  }

  if (!staff.permissions.includes('catalog.manage')) {
    return (
      <StaffShell staff={staff}>
        <div className="empty-panel">
          You do not have catalog management access.
        </div>
      </StaffShell>
    );
  }

  async function save(
    path: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiJson(path, { method: 'PUT', body: JSON.stringify(body) });
      setMessage(successMessage);
      await load();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function submitOutlet(event: FormEvent) {
    event.preventDefault();
    if (!validId(outlet.id)) {
      setError('Outlet ID must use lowercase letters, numbers, and hyphens.');
      return;
    }
    void save(
      `/api/staff/catalog/outlets/${outlet.id}`,
      {
        name: outlet.name,
        note: outlet.note,
        imageUrl: outlet.imageUrl || null,
        currency: outlet.currency,
        timezone: outlet.timezone,
        active: outlet.active,
        sortOrder: outlet.sortOrder,
        pickupEnabled: outlet.pickupEnabled,
        deliveryEnabled: outlet.deliveryEnabled,
        latitude: outlet.latitude,
        longitude: outlet.longitude,
        deliveryRadiusMeters: outlet.deliveryRadiusMeters,
        deliveryBaseFee: outlet.deliveryBaseFee,
        deliveryPerKmFee: outlet.deliveryPerKmFee,
      },
      `Outlet ${outlet.id} saved. New outlets start with products unavailable.`,
    );
  }

  function submitCategory(event: FormEvent) {
    event.preventDefault();
    if (!validId(category.id)) {
      setError('Category ID must use lowercase letters, numbers, and hyphens.');
      return;
    }
    void save(
      `/api/staff/catalog/categories/${category.id}`,
      { name: category.name, sortOrder: category.sortOrder },
      `Category ${category.id} saved.`,
    );
  }

  function submitProduct(event: FormEvent) {
    event.preventDefault();
    if (!validId(product.id)) {
      setError('Product ID must use lowercase letters, numbers, and hyphens.');
      return;
    }
    void save(
      `/api/staff/catalog/products/${product.id}`,
      {
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl || null,
        basePrice: product.basePrice,
        categoryId: product.categoryId,
        active: product.active,
        isBestseller: product.isBestseller,
      },
      `Product ${product.id} saved.`,
    );
  }

  function submitCampaign(event: FormEvent) {
    event.preventDefault();
    if (!validId(campaign.id)) {
      setError('Campaign ID must use lowercase letters, numbers, and hyphens.');
      return;
    }
    void save(
      `/api/staff/catalog/campaigns/${campaign.id}`,
      {
        title: campaign.title,
        body: campaign.body,
        ctaLabel: campaign.ctaLabel,
        imageUrl: campaign.imageUrl,
        actionPath: campaign.actionPath,
        active: campaign.active,
        sortOrder: campaign.sortOrder,
      },
      `Campaign ${campaign.id} saved.`,
    );
  }

  async function toggleAvailability(outletId: string, available: boolean) {
    if (!product.id) return;
    const saved = await save(
      `/api/staff/catalog/outlets/${outletId}/products/${product.id}`,
      { available },
      `${product.name} is now ${available ? 'available' : 'unavailable'} at ${outletId}.`,
    );
    if (!saved) return;
    setProduct((current) => ({
      ...current,
      outletAvailability: [
        ...current.outletAvailability.filter(
          (item) => item.outletId !== outletId,
        ),
        { outletId, available },
      ],
    }));
  }

  const productExists =
    overview?.products.some((item) => item.id === product.id) ?? false;

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">CATALOG CONTROL</p>
          <h1>Menu, outlets & campaigns</h1>
          <p>
            Manage customer-facing content and per-outlet menu availability.
            Media is referenced by HTTPS URL; file storage remains an external
            CDN concern.
          </p>
        </div>
      </header>

      {error ? <div className="inline-alert">{error}</div> : null}
      {message ? (
        <div className="detail-card catalog-message">{message}</div>
      ) : null}

      <div className="catalog-admin-grid">
        <section className="detail-card catalog-list-panel">
          <p className="eyebrow">OUTLETS</p>
          <h2>Order locations</h2>
          <button
            className="secondary-button compact-button"
            type="button"
            onClick={() => setOutlet(emptyOutlet)}
          >
            New outlet
          </button>
          <div className="catalog-entity-list">
            {overview?.outlets.map((item) => (
              <button
                className="catalog-entity-button"
                type="button"
                key={item.id}
                onClick={() => setOutlet(item)}
              >
                <strong>{item.name}</strong>
                <span>
                  {item.active ? 'Active' : 'Inactive'} · {item.currency}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">OUTLET EDITOR</p>
          <h2>{outlet.id || 'New outlet'}</h2>
          <form className="form-stack" onSubmit={submitOutlet}>
            <label>
              Stable ID
              <input
                required
                value={outlet.id}
                onChange={(event) =>
                  setOutlet({ ...outlet, id: event.target.value.toLowerCase() })
                }
                placeholder="bogor-outlet"
              />
            </label>
            <label>
              Name
              <input
                required
                value={outlet.name}
                onChange={(event) =>
                  setOutlet({ ...outlet, name: event.target.value })
                }
              />
            </label>
            <label>
              Customer note
              <input
                value={outlet.note}
                onChange={(event) =>
                  setOutlet({ ...outlet, note: event.target.value })
                }
              />
            </label>
            <label>
              Image URL
              <input
                value={outlet.imageUrl ?? ''}
                onChange={(event) =>
                  setOutlet({ ...outlet, imageUrl: event.target.value })
                }
                placeholder="https://cdn.example.com/outlet.webp"
              />
            </label>
            <div className="form-split">
              <label>
                Currency
                <input
                  required
                  maxLength={3}
                  value={outlet.currency}
                  onChange={(event) =>
                    setOutlet({
                      ...outlet,
                      currency: event.target.value.toUpperCase(),
                    })
                  }
                />
              </label>
              <label>
                Timezone
                <input
                  required
                  value={outlet.timezone}
                  onChange={(event) =>
                    setOutlet({ ...outlet, timezone: event.target.value })
                  }
                />
              </label>
              <label>
                Sort order
                <input
                  min={0}
                  type="number"
                  value={outlet.sortOrder}
                  onChange={(event) =>
                    setOutlet({
                      ...outlet,
                      sortOrder: numberValue(event.target.value) ?? 0,
                    })
                  }
                />
              </label>
            </div>
            <div className="checkbox-group">
              <Check
                label="Active"
                checked={outlet.active}
                onChange={(active) => setOutlet({ ...outlet, active })}
              />
              <Check
                label="Pickup"
                checked={outlet.pickupEnabled}
                onChange={(pickupEnabled) =>
                  setOutlet({ ...outlet, pickupEnabled })
                }
              />
              <Check
                label="Delivery"
                checked={outlet.deliveryEnabled}
                onChange={(deliveryEnabled) =>
                  setOutlet({ ...outlet, deliveryEnabled })
                }
              />
            </div>
            <div className="form-split">
              <label>
                Latitude
                <input
                  step="any"
                  type="number"
                  value={outlet.latitude ?? ''}
                  onChange={(event) =>
                    setOutlet({
                      ...outlet,
                      latitude: numberValue(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Longitude
                <input
                  step="any"
                  type="number"
                  value={outlet.longitude ?? ''}
                  onChange={(event) =>
                    setOutlet({
                      ...outlet,
                      longitude: numberValue(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Radius (m)
                <input
                  min={0}
                  type="number"
                  value={outlet.deliveryRadiusMeters ?? ''}
                  onChange={(event) =>
                    setOutlet({
                      ...outlet,
                      deliveryRadiusMeters: numberValue(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Base fee
                <input
                  min={0}
                  type="number"
                  value={outlet.deliveryBaseFee}
                  onChange={(event) =>
                    setOutlet({
                      ...outlet,
                      deliveryBaseFee: numberValue(event.target.value) ?? 0,
                    })
                  }
                />
              </label>
              <label>
                Fee/km
                <input
                  min={0}
                  type="number"
                  value={outlet.deliveryPerKmFee}
                  onChange={(event) =>
                    setOutlet({
                      ...outlet,
                      deliveryPerKmFee: numberValue(event.target.value) ?? 0,
                    })
                  }
                />
              </label>
            </div>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save outlet'}
            </button>
          </form>
        </section>

        <section className="detail-card catalog-list-panel">
          <p className="eyebrow">PRODUCTS</p>
          <h2>Customer menu</h2>
          <button
            className="secondary-button compact-button"
            type="button"
            onClick={() =>
              setProduct({
                ...emptyProduct,
                categoryId: overview?.categories[0]?.id ?? '',
              })
            }
          >
            New product
          </button>
          <div className="catalog-entity-list">
            {overview?.products.map((item) => (
              <button
                className="catalog-entity-button"
                type="button"
                key={item.id}
                onClick={() => setProduct(item)}
              >
                <strong>{item.name}</strong>
                <span>
                  {item.category.name} · {item.basePrice}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">PRODUCT EDITOR</p>
          <h2>{product.id || 'New product'}</h2>
          <form className="form-stack" onSubmit={submitProduct}>
            <label>
              Stable ID
              <input
                required
                value={product.id}
                onChange={(event) =>
                  setProduct({
                    ...product,
                    id: event.target.value.toLowerCase(),
                  })
                }
                placeholder="fusion-latte"
              />
            </label>
            <label>
              Name
              <input
                required
                value={product.name}
                onChange={(event) =>
                  setProduct({ ...product, name: event.target.value })
                }
              />
            </label>
            <label>
              Description
              <textarea
                required
                value={product.description}
                onChange={(event) =>
                  setProduct({ ...product, description: event.target.value })
                }
              />
            </label>
            <label>
              Image URL
              <input
                value={product.imageUrl ?? ''}
                onChange={(event) =>
                  setProduct({ ...product, imageUrl: event.target.value })
                }
                placeholder="https://cdn.example.com/product.webp"
              />
            </label>
            <div className="form-split">
              <label>
                Base price
                <input
                  required
                  min={0}
                  type="number"
                  value={product.basePrice}
                  onChange={(event) =>
                    setProduct({
                      ...product,
                      basePrice: numberValue(event.target.value) ?? 0,
                    })
                  }
                />
              </label>
              <label>
                Category
                <select
                  required
                  value={product.categoryId}
                  onChange={(event) =>
                    setProduct({ ...product, categoryId: event.target.value })
                  }
                >
                  {overview?.categories.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="checkbox-group">
              <Check
                label="Active"
                checked={product.active}
                onChange={(active) => setProduct({ ...product, active })}
              />
              <Check
                label="Bestseller"
                checked={product.isBestseller}
                onChange={(isBestseller) =>
                  setProduct({ ...product, isBestseller })
                }
              />
            </div>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save product'}
            </button>
          </form>
          {productExists ? (
            <div className="availability-list">
              <h3>Outlet availability</h3>
              {overview?.outlets.map((item) => {
                const available =
                  product.outletAvailability.find(
                    (entry) => entry.outletId === item.id,
                  )?.available ?? false;
                return (
                  <div className="availability-row" key={item.id}>
                    <span>{item.name}</span>
                    <button
                      className={
                        available
                          ? 'secondary-button compact-button'
                          : 'primary-button compact-button'
                      }
                      disabled={busy}
                      type="button"
                      onClick={() =>
                        void toggleAvailability(item.id, !available)
                      }
                    >
                      {available ? 'Mark unavailable' : 'Make available'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
          {productExists ? (
            <CatalogModifierEditor
              key={product.id}
              product={product}
              busy={busy}
              save={save}
            />
          ) : product.id ? (
            <p className="catalog-helper-copy">
              Save the product before adding customization groups.
            </p>
          ) : null}
        </section>

        <section className="detail-card catalog-list-panel">
          <p className="eyebrow">CAMPAIGNS</p>
          <h2>Home banners</h2>
          <button
            className="secondary-button compact-button"
            type="button"
            onClick={() => setCampaign(emptyCampaign)}
          >
            New campaign
          </button>
          <div className="catalog-entity-list">
            {overview?.campaigns.map((item) => (
              <button
                className="catalog-entity-button"
                type="button"
                key={item.id}
                onClick={() => setCampaign(item)}
              >
                <strong>{item.title}</strong>
                <span>
                  {item.active ? 'Active' : 'Inactive'} · {item.actionPath}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">CAMPAIGN EDITOR</p>
          <h2>{campaign.id || 'New campaign'}</h2>
          <form className="form-stack" onSubmit={submitCampaign}>
            <label>
              Stable ID
              <input
                required
                value={campaign.id}
                onChange={(event) =>
                  setCampaign({
                    ...campaign,
                    id: event.target.value.toLowerCase(),
                  })
                }
                placeholder="weekend-pickup"
              />
            </label>
            <label>
              Title
              <input
                required
                value={campaign.title}
                onChange={(event) =>
                  setCampaign({ ...campaign, title: event.target.value })
                }
              />
            </label>
            <label>
              Body
              <textarea
                required
                value={campaign.body}
                onChange={(event) =>
                  setCampaign({ ...campaign, body: event.target.value })
                }
              />
            </label>
            <label>
              CTA label
              <input
                required
                value={campaign.ctaLabel}
                onChange={(event) =>
                  setCampaign({ ...campaign, ctaLabel: event.target.value })
                }
              />
            </label>
            <label>
              Image URL
              <input
                required
                value={campaign.imageUrl}
                onChange={(event) =>
                  setCampaign({ ...campaign, imageUrl: event.target.value })
                }
              />
            </label>
            <div className="form-split">
              <label>
                Destination
                <select
                  value={campaign.actionPath}
                  onChange={(event) =>
                    setCampaign({
                      ...campaign,
                      actionPath: event.target.value as '/menu' | '/rewards',
                    })
                  }
                >
                  <option value="/menu">Menu</option>
                  <option value="/rewards">Rewards</option>
                </select>
              </label>
              <label>
                Sort order
                <input
                  min={0}
                  type="number"
                  value={campaign.sortOrder}
                  onChange={(event) =>
                    setCampaign({
                      ...campaign,
                      sortOrder: numberValue(event.target.value) ?? 0,
                    })
                  }
                />
              </label>
            </div>
            <Check
              label="Active"
              checked={campaign.active}
              onChange={(active) => setCampaign({ ...campaign, active })}
            />
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save campaign'}
            </button>
          </form>
        </section>

        <section className="detail-card catalog-span">
          <p className="eyebrow">CATEGORIES</p>
          <h2>Menu grouping</h2>
          <div className="category-editor-row">
            <div className="catalog-entity-list">
              <button
                className="secondary-button compact-button"
                type="button"
                onClick={() => setCategory(emptyCategory)}
              >
                New category
              </button>
              {overview?.categories.map((item) => (
                <button
                  className="catalog-entity-button"
                  type="button"
                  key={item.id}
                  onClick={() => setCategory(item)}
                >
                  <strong>{item.name}</strong>
                  <span>Order {item.sortOrder}</span>
                </button>
              ))}
            </div>
            <form className="form-stack" onSubmit={submitCategory}>
              <label>
                Stable ID
                <input
                  required
                  value={category.id}
                  onChange={(event) =>
                    setCategory({
                      ...category,
                      id: event.target.value.toLowerCase(),
                    })
                  }
                  placeholder="seasonal"
                />
              </label>
              <label>
                Name
                <input
                  required
                  value={category.name}
                  onChange={(event) =>
                    setCategory({ ...category, name: event.target.value })
                  }
                />
              </label>
              <label>
                Sort order
                <input
                  min={0}
                  type="number"
                  value={category.sortOrder}
                  onChange={(event) =>
                    setCategory({
                      ...category,
                      sortOrder: numberValue(event.target.value) ?? 0,
                    })
                  }
                />
              </label>
              <button className="primary-button" disabled={busy}>
                {busy ? 'Saving…' : 'Save category'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </StaffShell>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function numberValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validId(value: string) {
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(value);
}
