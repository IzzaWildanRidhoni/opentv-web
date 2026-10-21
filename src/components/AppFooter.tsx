import type { ViewMode } from './NavRail';
import {
  ArrowUpRightIcon,
  ClockIcon,
  GlobeIcon,
  HomeIcon,
  SearchIcon,
  StarIcon,
  TvIcon,
} from './icons';

type AppFooterProps = {
  onNavigate: (mode: ViewMode) => void;
};

const NAV_ITEMS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'home', label: 'Beranda', icon: <HomeIcon className="h-3.5 w-3.5" /> },
  { mode: 'search', label: 'Cari channel', icon: <SearchIcon className="h-3.5 w-3.5" /> },
  { mode: 'favorites', label: 'Favorit', icon: <StarIcon className="h-3.5 w-3.5" /> },
  { mode: 'recents', label: 'Terakhir ditonton', icon: <ClockIcon className="h-3.5 w-3.5" /> },
];

const HIGHLIGHTS = [
  'Cek ketersediaan siaran otomatis di browser',
  'Tanpa daftar akun, langsung tayang',
];

export function AppFooter({ onNavigate }: AppFooterProps) {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-white/6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(50%_60%_at_50%_100%,rgba(149,255,80,0.05),transparent_70%)]"
      />

      <div className="mx-auto grid w-full max-w-[1700px] gap-8 px-3 py-10 sm:px-8 md:grid-cols-[1fr_auto_auto] md:gap-14">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-300 to-accent-500 text-ink-950 shadow-[0_0_24px_rgba(149,255,80,0.25)]">
              <TvIcon className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              OpenTV
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Nonton siaran TV dunia langsung di browser. Cari channel, simpan
            favorit, dan lanjutkan tontonan terakhir — semuanya tanpa
            berlangganan.
          </p>
        </div>

        <nav
          aria-label="Navigasi footer"
          className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-1"
        >
          <p className="col-span-2 mb-1 text-[11px] font-bold tracking-[0.14em] text-white/60 uppercase sm:col-span-1">
            Jelajahi
          </p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => onNavigate(item.mode)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-accent-300"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <ul className="space-y-2.5">
          <li className="mb-1 text-[11px] font-bold tracking-[0.14em] text-white/60 uppercase">
            Keunggulan
          </li>
          {HIGHLIGHTS.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2 text-xs text-slate-400"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
              <span className="max-w-56">{highlight}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative border-t border-white/6">
        <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center justify-between gap-2 px-3 py-4 text-[11px] text-slate-600 sm:px-8">
          <p>© {new Date().getFullYear()} OpenTV — tonton TV, tanpa ribet.</p>
          <a
            href="https://izzawildan.my.id"
            target="_blank"
            rel="noreferrer"
            title="Dibuat oleh izzawildan.my.id"
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[.03] px-3 py-1.5 font-medium text-slate-400 transition-colors hover:border-accent-400/40 hover:text-accent-300"
          >
            <GlobeIcon className="h-3.5 w-3.5" />
            dibuat oleh izzawildan.my.id
            <ArrowUpRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
