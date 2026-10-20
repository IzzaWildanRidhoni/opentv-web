import type { ReactNode } from 'react';

type GroupCount = { name: string; count: number };

type QuickFiltersProps = {
  groups: GroupCount[];
  activeGroup: string;
  onGroupSelect: (group: string) => void;
  indonesiaCount: number;
  indonesiaActive: boolean;
  onIndonesiaToggle: () => void;
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-accent-400/50 bg-accent-400/12 text-accent-200'
          : 'border-white/8 bg-white/4 text-slate-300 hover:border-white/15 hover:bg-white/8 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function QuickFilters({
  groups,
  activeGroup,
  onGroupSelect,
  indonesiaCount,
  indonesiaActive,
  onIndonesiaToggle,
}: QuickFiltersProps) {
  if (groups.length === 0 && indonesiaCount === 0) return null;

  return (
    <section className="rounded-2xl border border-white/8 bg-ink-900/60 p-3.5 sm:p-4">
      <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        Jelajahi cepat
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {groups.map((group) => {
          const active = group.name === activeGroup;
          return (
            <Chip
              key={group.name}
              active={active}
              onClick={() => onGroupSelect(active ? '' : group.name)}
            >
              {group.name}
              <span
                className={`text-[10px] tabular-nums ${
                  active ? 'text-accent-300/80' : 'text-slate-500'
                }`}
              >
                {group.count.toLocaleString('id-ID')}
              </span>
            </Chip>
          );
        })}

        {indonesiaCount > 0 && (
          <Chip active={indonesiaActive} onClick={onIndonesiaToggle}>
            Indonesia
            <span
              className={`text-[10px] tabular-nums ${
                indonesiaActive ? 'text-accent-300/80' : 'text-slate-500'
              }`}
            >
              {indonesiaCount.toLocaleString('id-ID')}
            </span>
          </Chip>
        )}
      </div>
    </section>
  );
}
