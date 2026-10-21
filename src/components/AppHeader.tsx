import { LIME_GRADIENT, LIME_GRADIENT_HOVER } from '../lib/theme';
import { RefreshIcon, TvIcon } from './icons';

type AppHeaderProps = {
  title: string;
  isLoading: boolean;
  hideUnavailable: boolean;
  onToggleHideUnavailable: () => void;
  onReload: () => void;
};

export function AppHeader({
  title,
  isLoading,
  hideUnavailable,
  onToggleHideUnavailable,
  onReload,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-5">
        {/* Logo mobile (desktop pakai rail) */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="OpenTV"
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl lg:hidden ${LIME_GRADIENT}`}
        >
          <TvIcon className="ml-0.5 h-4 w-4" strokeWidth={2.2} />
        </button>

        <h1 className="font-display min-w-0 flex-1 truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {title}
        </h1>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Toggle: sembunyikan channel yang gagal */}
          <button
            type="button"
            role="switch"
            aria-checked={hideUnavailable}
            onClick={onToggleHideUnavailable}
            title="Sembunyikan channel yang gagal diputar"
            className="hidden items-center gap-2.5 pr-1 text-sm font-medium text-slate-400 transition-colors hover:text-white sm:flex"
          >
            <span>Sembunyikan gagal</span>
            <span className="relative inline-block h-6 w-11">
              <span
                className={`absolute inset-0 rounded-full transition-colors ${
                  hideUnavailable
                    ? 'bg-gradient-to-br from-accent-300 to-accent-500'
                    : 'bg-white/15'
                }`}
              />
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  hideUnavailable ? 'translate-x-5 bg-ink-950' : ''
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={onReload}
            disabled={isLoading}
            aria-label="Muat ulang playlist"
            title="Muat ulang playlist"
            className={`grid h-10 w-10 place-items-center rounded-xl border border-white/8 bg-white/4 text-slate-300 transition-colors hover:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${LIME_GRADIENT_HOVER}`}
          >
            <RefreshIcon
              className={`h-4.5 w-4.5 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
