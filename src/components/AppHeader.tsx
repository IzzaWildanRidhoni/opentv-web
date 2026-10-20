import { RefreshIcon, SpinnerIcon, TvIcon } from './icons';
import { SearchInput } from './SearchInput';

type AppHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  total: number;
  isLoading: boolean;
  onReload: () => void;
};

export function AppHeader({
  search,
  onSearchChange,
  total,
  isLoading,
  onReload,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-3 py-2.5 sm:gap-5 sm:px-5">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-400 to-cyan-600 text-ink-950 shadow-[0_0_24px_-6px] shadow-accent-400/70">
            <TvIcon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-white">
              OpenTV
            </p>
            <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
              Live TV from public playlists
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <div className="w-full max-w-xl">
            <SearchInput value={search} onChange={onSearchChange} />
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-400 sm:inline-flex">
            {isLoading ? 'Memuat…' : `${total.toLocaleString('id-ID')} channel`}
          </span>
          <button
            type="button"
            onClick={onReload}
            disabled={isLoading}
            aria-label="Muat ulang playlist"
            title="Muat ulang playlist"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/8 bg-ink-850 text-slate-300 transition-colors hover:border-white/15 hover:bg-ink-750 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <SpinnerIcon className="h-4.5 w-4.5 animate-spin text-accent-400" />
            ) : (
              <RefreshIcon className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      <div className="px-3 pb-2.5 md:hidden">
        <SearchInput value={search} onChange={onSearchChange} />
      </div>
    </header>
  );
}
