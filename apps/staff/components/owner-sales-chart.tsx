import type { OwnerDashboardTrendPoint } from '@/lib/types';

export function OwnerSalesChart({
  trend,
  currency,
}: {
  trend: OwnerDashboardTrendPoint[];
  currency: string;
}) {
  const values = trend.map(
    (point) =>
      point.currencies.find((entry) => entry.currency === currency)?.netSales ??
      0,
  );
  const maximum = Math.max(...values, 0);
  if (maximum === 0) {
    return (
      <div className="dashboard-chart-empty">
        No paid sales recorded for this range.
      </div>
    );
  }

  const width = 720;
  const height = 240;
  const left = 56;
  const right = 20;
  const top = 18;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const points = values.map((value, index) => ({
    x:
      left +
      (values.length === 1
        ? chartWidth / 2
        : (index / (values.length - 1)) * chartWidth),
    y: top + chartHeight - (value / maximum) * chartHeight,
  }));
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const labelIndexes = [
    ...new Set([0, Math.floor((trend.length - 1) / 2), trend.length - 1]),
  ];

  return (
    <svg
      className="dashboard-chart"
      role="img"
      aria-label={`${currency} paid sales trend`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <title>{currency} paid sales trend</title>
      {[0, 0.5, 1].map((fraction) => {
        const y = top + chartHeight - fraction * chartHeight;
        return (
          <g key={fraction}>
            <line
              className="dashboard-chart-grid"
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
            />
            <text className="dashboard-chart-axis" x={left - 10} y={y + 4}>
              {compactMoney(Math.round(maximum * fraction), currency)}
            </text>
          </g>
        );
      })}
      <path className="dashboard-chart-line" d={path} />
      {points.map((point, index) => (
        <circle
          className="dashboard-chart-point"
          cx={point.x}
          cy={point.y}
          r="4"
          key={trend[index].date}
        />
      ))}
      {labelIndexes.map((index) => (
        <text
          className="dashboard-chart-axis dashboard-chart-date"
          x={points[index].x}
          y={height - 12}
          textAnchor="middle"
          key={trend[index].date}
        >
          {new Intl.DateTimeFormat('en', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(`${trend[index].date}T00:00:00Z`))}
        </text>
      ))}
    </svg>
  );
}

function compactMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
