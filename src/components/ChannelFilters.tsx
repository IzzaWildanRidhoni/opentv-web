import type { ReactNode } from 'react';
import { countryName } from '../lib/countries';
import { ChevronDownIcon, CloseIcon, StarIcon } from './icons';

export type ChannelView = 'all' | 'favorites';

type ChannelFiltersProps = {
  view: ChannelView;
  onViewChange: (view: ChannelView) => void;
  groups: string[];
  activeGroup: string;
  onGroupChange: (group: string) => void;
  countries: string[];
  activeCountry: string;
  onCountryChange: (country: string) => void;
  favoriteCount: number;
  resultCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9.5 w-full cursor-pointer appearance-none truncate rounded-lg border border-white/8 bg-ink-850 pr-8 pl-3 text-[13px] font-medium text-slate-200 transition-colors outline-none hover:border-white/15 focus:border-accent-400/60"
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
    </label>
  );
}

export function ChannelFilters({
  view,
  onViewChange,
  groups,
  activeGroup,
  onGroupChange,
  countries,
  activeCountry,
  onCountryChange,
  favoriteCount,
  resultCount,
  hasActiveFilters,
  onResetFilters,
}: ChannelFiltersProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Sumber daftar channel"
          className="flex flex-1 rounded-lg border border-white/8 bg-ink-900 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'all'}
            onClick={() => onViewChange('all')}
            className={`flex-1 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              view === 'all'
                ? 'bg-ink-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'favorites'}
            onClick={() => onViewChange('favorites')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              view === 'favorites'
                ? 'bg-ink-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <StarIcon
              filled={view === 'favorites'}
              className={`h-3.5 w-3.5 ${view === 'favorites' ? 'text-amber-400' : ''}`}
            />
            Favorit
            {favoriteCount > 0 && (
              <span className="rounded-full bg-white/10 px-1.5 text-[11px] tabular-nums">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>

        <span className="shrink-0 pr-1 text-[11px] font-medium text-slate-500 tabular-nums">
          {resultCount.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Select
          label="Filter kategori"
          value={activeGroup}
          onChange={onGroupChange}
        >
          <option value="">Semua kategori</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>

        <Select
          label="Filter negara"
          value={activeCountry}
          onChange={onCountryChange}
        >
          <option value="">Semua negara</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {countryName(country)} ({country})
            </option>
          ))}
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            aria-label="Hapus semua filter"
            title="Hapus semua filter"
            className="grid h-9.5 w-9.5 shrink-0 place-items-center rounded-lg border border-white/8 bg-ink-850 text-slate-400 transition-colors hover:border-white/15 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
