'use client';

import { type FormEvent, useState } from 'react';
import type {
  CatalogAdminModifierGroup,
  CatalogAdminModifierOption,
  CatalogAdminProduct,
} from '@/lib/types';

type SaveRequest = (
  path: string,
  body: Record<string, unknown>,
  successMessage: string,
) => Promise<boolean>;

export function CatalogModifierEditor({
  product,
  busy,
  save,
}: {
  product: CatalogAdminProduct;
  busy: boolean;
  save: SaveRequest;
}) {
  const [groups, setGroups] = useState(product.modifierGroups);
  const [draft, setDraft] = useState<CatalogAdminModifierGroup>(() =>
    emptyGroup(product.id),
  );
  const [error, setError] = useState('');

  function chooseGroup(group: CatalogAdminModifierGroup) {
    setDraft({
      ...group,
      options: group.options.map((option) => ({ ...option })),
    });
    setError('');
  }

  function addOption() {
    setDraft((current) => ({
      ...current,
      options: [
        ...current.options,
        emptyOption(current.id, current.options.length),
      ],
    }));
  }

  function updateOption(
    index: number,
    update: Partial<CatalogAdminModifierOption>,
  ) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...update } : option,
      ),
    }));
  }

  function removeOption(index: number) {
    setDraft((current) => ({
      ...current,
      options: current.options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validId(draft.id)) {
      setError('Group ID must use lowercase letters, numbers, and hyphens.');
      return;
    }
    if (draft.options.some((option) => !validId(option.id))) {
      setError('Every option needs a stable lowercase ID.');
      return;
    }
    if (
      new Set(draft.options.map((option) => option.id)).size !==
      draft.options.length
    ) {
      setError('Option IDs must be unique inside this group.');
      return;
    }
    if (draft.active && !draft.options.some((option) => option.active)) {
      setError('An active group needs at least one active option.');
      return;
    }
    if (
      !draft.allowMultiple &&
      draft.options.filter((option) => option.active && option.isDefault)
        .length > 1
    ) {
      setError('Single-select groups can only have one default option.');
      return;
    }

    setError('');
    const saved = await save(
      `/api/staff/catalog/products/${product.id}/modifier-groups/${draft.id}`,
      {
        name: draft.name,
        active: draft.active,
        required: draft.required,
        allowMultiple: draft.allowMultiple,
        sortOrder: draft.sortOrder,
        options: draft.options.map((option) => ({
          id: option.id,
          name: option.name,
          priceDelta: option.priceDelta,
          isDefault: option.isDefault,
          active: option.active,
          sortOrder: option.sortOrder,
        })),
      },
      `Modifier group ${draft.name} saved.`,
    );
    if (!saved) return;

    const normalized = {
      ...draft,
      productId: product.id,
      options: draft.options.map((option) => ({
        ...option,
        modifierGroupId: draft.id,
      })),
    };
    setGroups((current) => [
      ...current.filter((group) => group.id !== normalized.id),
      normalized,
    ]);
    setDraft(normalized);
  }

  return (
    <section className="modifier-editor">
      <div className="modifier-editor-heading">
        <div>
          <p className="eyebrow">CUSTOMIZATION</p>
          <h3>Modifier groups</h3>
          <p>Manage size, temperature, milk, sugar, toppings, and add-ons.</p>
        </div>
        <button
          className="secondary-button compact-button"
          type="button"
          onClick={() => setDraft(emptyGroup(product.id))}
        >
          New group
        </button>
      </div>

      <div className="modifier-group-tabs" aria-label="Modifier groups">
        {groups.map((group) => (
          <button
            className={group.id === draft.id ? 'active' : ''}
            key={group.id}
            type="button"
            onClick={() => chooseGroup(group)}
          >
            <strong>{group.name}</strong>
            <span>{group.active ? 'Active' : 'Archived'}</span>
          </button>
        ))}
      </div>

      {error ? <div className="inline-alert">{error}</div> : null}

      <form className="form-stack modifier-form" onSubmit={submit}>
        <div className="form-split">
          <label>
            Stable group ID
            <input
              disabled={groups.some((group) => group.id === draft.id)}
              required
              value={draft.id}
              onChange={(event) =>
                setDraft({ ...draft, id: event.target.value.toLowerCase() })
              }
              placeholder={`${product.id}-size`}
            />
          </label>
          <label>
            Customer label
            <input
              required
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              placeholder="Size"
            />
          </label>
          <label>
            Sort order
            <input
              min={0}
              type="number"
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  sortOrder: numberValue(event.target.value),
                })
              }
            />
          </label>
        </div>
        <div className="checkbox-group">
          <ModifierCheck
            label="Active"
            checked={draft.active}
            onChange={(active) => setDraft({ ...draft, active })}
          />
          <ModifierCheck
            label="Required"
            checked={draft.required}
            onChange={(required) => setDraft({ ...draft, required })}
          />
          <ModifierCheck
            label="Allow multiple"
            checked={draft.allowMultiple}
            onChange={(allowMultiple) => setDraft({ ...draft, allowMultiple })}
          />
        </div>

        <div className="modifier-options-heading">
          <h4>Options</h4>
          <button
            className="secondary-button compact-button"
            type="button"
            onClick={addOption}
          >
            Add option
          </button>
        </div>
        <div className="modifier-options-list">
          {draft.options.map((option, index) => (
            <fieldset className="modifier-option-row" key={index}>
              <legend>Option {index + 1}</legend>
              <label>
                Stable option ID
                <input
                  disabled={groups.some((group) =>
                    group.options.some((item) => item.id === option.id),
                  )}
                  required
                  value={option.id}
                  onChange={(event) =>
                    updateOption(index, {
                      id: event.target.value.toLowerCase(),
                    })
                  }
                  placeholder={`${draft.id || product.id}-regular`}
                />
              </label>
              <label>
                Customer label
                <input
                  required
                  value={option.name}
                  onChange={(event) =>
                    updateOption(index, { name: event.target.value })
                  }
                  placeholder="Regular"
                />
              </label>
              <label>
                Price delta
                <input
                  min={0}
                  type="number"
                  value={option.priceDelta}
                  onChange={(event) =>
                    updateOption(index, {
                      priceDelta: numberValue(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Sort order
                <input
                  min={0}
                  type="number"
                  value={option.sortOrder}
                  onChange={(event) =>
                    updateOption(index, {
                      sortOrder: numberValue(event.target.value),
                    })
                  }
                />
              </label>
              <div className="modifier-option-actions">
                <ModifierCheck
                  label="Active"
                  checked={option.active}
                  onChange={(active) =>
                    updateOption(index, {
                      active,
                      isDefault: active ? option.isDefault : false,
                    })
                  }
                />
                <ModifierCheck
                  label="Default"
                  checked={option.isDefault}
                  onChange={(isDefault) =>
                    updateOption(index, {
                      isDefault,
                      active: isDefault ? true : option.active,
                    })
                  }
                />
                <button
                  className="text-button"
                  type="button"
                  onClick={() => removeOption(index)}
                >
                  Archive row
                </button>
              </div>
            </fieldset>
          ))}
        </div>
        <button className="primary-button" disabled={busy}>
          {busy ? 'Saving…' : 'Save modifier group'}
        </button>
      </form>
    </section>
  );
}

function ModifierCheck({
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

function emptyGroup(productId: string): CatalogAdminModifierGroup {
  return {
    id: '',
    productId,
    name: '',
    active: true,
    required: false,
    allowMultiple: false,
    sortOrder: 0,
    options: [emptyOption('', 0)],
  };
}

function emptyOption(
  modifierGroupId: string,
  sortOrder: number,
): CatalogAdminModifierOption {
  return {
    id: '',
    modifierGroupId,
    name: '',
    priceDelta: 0,
    isDefault: false,
    active: true,
    sortOrder,
  };
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function validId(value: string) {
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(value);
}
