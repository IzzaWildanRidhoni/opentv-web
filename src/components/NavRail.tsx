import { TvIcon, SearchIcon, StarIcon, ClockIcon } from './icons';
import { LIME_GRADIENT } from '../lib/theme';
import type { ComponentType, SVGProps } from 'react';

export type ViewMode = 'home' | 'search' | 'favorites' | 'recents';

type NavItem = {
  mode: ViewMode;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const VIEW_LABELS: Record<ViewMode, string> = {
  home: 'Beranda',
  search: 'Cari channel',
  favorites: 'Favorit',
  recents: 'Riwayat',
};

export const NAV_ITEMS: NavItem[] = [
  { mode: 'home', label: 'Beranda', icon: TvIcon },
  { mode: 'search', label: 'Cari', icon: SearchIcon },
  { mode: 'favorites', label: 'Favorit', icon: StarIcon },
  { mode: 'recents', label: 'Riwayat', icon: ClockIcon },
];

type NavRailProps = {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
};

export function NavRail({ mode, onModeChange }: NavRailProps) {
  return (
    <>
      {/* Rail kiri (desktop) */}
      <aside
        aria-label="Navigasi utama"
        className="fixed inset-y-0 left-0 z-50 hidden w-[92px] flex-col items-center gap-1.5 border-r border-white/6 bg-ink-900/70 px-3 py-5 backdrop-blur-xl lg:flex"
      >
        <button
          type="button"
          onClick={() => onModeChange('home')}
          aria-label="OpenTV"
          className={`mb-5 grid h-11 w-11 place-items-center rounded-2xl ${LIME_GRADIENT}`}
        >
          <TvIcon className="h-5 w-5" strokeWidth={2.2} />
        </button>

        {NAV_ITEMS.map((item) => {
          const active = mode === item.mode;
          const Icon = item.icon;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => onModeChange(item.mode)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold transition-colors ${
                active ? LIME_GRADIENT : 'text-slate-400 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </aside>

      {/* Dock bawah (mobile) */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 flex items-center justify-between rounded-2xl border border-white/10 bg-ink-900/85 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = mode === item.mode;
          const Icon = item.icon;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => {
                onModeChange(item.mode);
                window.scrollTo({ top: 0 });
              }}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                active ? LIME_GRADIENT : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className={active ? 'inline' : 'hidden sm:inline'}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
