import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CloseIcon, SearchIcon } from './icons';

export type SelectOption = { value: string; label: string };

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  allLabel: string;
  placeholder?: string;
  icon?: ReactNode;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  allLabel,
  placeholder = 'Cari…',
  icon,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = term
      ? options.filter((option) =>
          option.label.toLowerCase().includes(term),
        )
      : options;

    return [
      { value: '', label: allLabel },
      ...matches.slice(0, 250),
    ];
  }, [options, query, allLabel]);

  const selected =
    value === '' ? null : options.find((option) => option.value === value);
  const hasValue = value !== '';

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          setOpen((state) => !state);
          setQuery('');
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-2.5 rounded-full border py-2.5 pr-2.5 pl-4 text-sm font-semibold transition-colors ${
          hasValue
            ? 'border-white/10 bg-white/[.06] text-white hover:bg-white/10'
            : 'border-white/8 bg-white/[.06] text-white/90 hover:bg-white/10 hover:text-white'
        }`}
      >
        {icon && (
          <span className="shrink-0 text-slate-500">{icon}</span>
        )}
        <span className="min-w-0 flex-1 truncate text-left">
          {selected?.label ?? allLabel}
        </span>
        {open ? (
          <CloseIcon
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-slate-500"
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4 shrink-0 fill-none stroke-slate-500"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {hasValue && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange('');
            setOpen(false);
          }}
          aria-label="Bersihkan pilihan"
          className="absolute top-1/2 right-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-3 w-3" strokeWidth={2.6} />
        </button>
      )}

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+0.6rem)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl shadow-black/70 backdrop-blur-xl">
          <div className="p-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-10 w-full rounded-full border border-white/8 bg-white/[.05] pr-4 pl-11 text-[13px] font-medium text-slate-100 placeholder:text-slate-500 focus:border-accent-400/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          </div>

          <div
            role="listbox"
            className="no-scrollbar max-h-64 overflow-y-auto p-2 pt-0"
          >
            {filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value || '__all__'}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors ${
                    active
                      ? 'text-accent-300'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 fill-none stroke-accent-400"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-slate-500">
                Tidak ada hasil.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
