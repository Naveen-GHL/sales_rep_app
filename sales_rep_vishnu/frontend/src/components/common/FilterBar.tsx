import React from 'react';
import { Filter, X } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  /** Stable identifier used as the React key */
  key: string;
  /** Human-readable label shown beside the select */
  label: string;
  /** Available choices — "All" is added automatically as the first option */
  options: FilterOption[];
  /** Controlled value (use 'All' for the default / unset state) */
  value: string;
  onChange: (value: string) => void;
}

export interface DateRangeDef {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export interface FilterBarProps {
  /** One entry per select dropdown that should be rendered */
  filters: FilterDef[];
  /** Optional date-range picker (two date inputs rendered side-by-side) */
  dateRange?: DateRangeDef;
  /**
   * Called when the user clicks "Clear filters".
   * The button is only shown when at least one filter differs from 'All'
   * or when a date range value is non-empty.
   */
  onClearAll?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  dateRange,
  onClearAll,
}) => {
  const hasActiveFilter =
    filters.some(f => f.value !== 'All' && f.value !== '') ||
    (dateRange ? dateRange.from !== '' || dateRange.to !== '' : false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      {/* Label */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        <Filter size={13} />
        Filters:
      </span>

      {/* Select Dropdowns */}
      {filters.map(filter => (
        <div
          key={filter.key}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <label
            htmlFor={`filter-${filter.key}`}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {filter.label}:
          </label>
          <select
            id={`filter-${filter.key}`}
            className="form-select"
            value={filter.value}
            onChange={e => filter.onChange(e.target.value)}
            style={{
              height: 32,
              fontSize: 12,
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 10,
              paddingRight: 28,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-base)',
              backgroundColor:
                filter.value !== 'All' && filter.value !== ''
                  ? 'var(--primary-50)'
                  : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              minWidth: 110,
            }}
          >
            <option value="All">All</option>
            {filter.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Optional Date Range Picker */}
      {dateRange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            From:
          </label>
          <input
            type="date"
            className="form-input"
            value={dateRange.from}
            onChange={e => dateRange.onChange(e.target.value, dateRange.to)}
            style={{
              height: 32,
              fontSize: 12,
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-base)',
              backgroundColor:
                dateRange.from !== '' ? 'var(--primary-50)' : 'var(--bg-surface)',
              minWidth: 130,
            }}
          />
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            To:
          </label>
          <input
            type="date"
            className="form-input"
            value={dateRange.to}
            onChange={e => dateRange.onChange(dateRange.from, e.target.value)}
            style={{
              height: 32,
              fontSize: 12,
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-base)',
              backgroundColor:
                dateRange.to !== '' ? 'var(--primary-50)' : 'var(--bg-surface)',
              minWidth: 130,
            }}
          />
        </div>
      )}

      {/* Clear All — only visible when something is active */}
      {hasActiveFilter && onClearAll && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClearAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: 'var(--text-secondary)',
            padding: '4px 8px',
            height: 32,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-base)',
            whiteSpace: 'nowrap',
          }}
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
};
