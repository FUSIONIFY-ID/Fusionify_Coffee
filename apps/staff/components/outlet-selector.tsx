import type { StaffOutlet } from '@/lib/types';

export function OutletSelector({
  outlets,
  value,
  onChange,
  allowAll = false,
  label = 'Outlet',
  disabled = false,
}: {
  outlets: StaffOutlet[];
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className="outlet-selector">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {allowAll ? <option value="">All outlets</option> : null}
        {!allowAll && !value ? <option value="">Select outlet</option> : null}
        {outlets.map((outlet) => (
          <option value={outlet.id} key={outlet.id}>
            {outlet.name}
            {outlet.active ? '' : ' (inactive)'}
          </option>
        ))}
      </select>
    </label>
  );
}
