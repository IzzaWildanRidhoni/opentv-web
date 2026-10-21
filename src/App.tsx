import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AppFooter } from './components/AppFooter';
import { AppHeader } from './components/AppHeader';
import { CategoryChips } from './components/CategoryChips';
import { ChannelList } from './components/ChannelList';
import { ChannelTile } from './components/ChannelTile';
import { NavRail, VIEW_LABELS, type ViewMode } from './components/NavRail';
import { SearchInput } from './components/SearchInput';
import { SearchableSelect } from './components/SearchableSelect';
import { VideoPlayer } from './components/VideoPlayer';
import type { PlayerStatus } from './components/VideoPlayer';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  GlobeIcon,
  SignalOffIcon,
  StarIcon,
  TvIcon,
} from './components/icons';
import { useFavorites } from './hooks/useFavorites';
import { usePlaylist } from './hooks/usePlaylist';
import { useRecents } from './hooks/useRecents';
import {
  getAvailability,
  getAvailabilityVersion,
  subscribeAvailability,
} from './lib/availability';
import { countryName } from './lib/countries';
import { LIME_GRADIENT, LIME_GRADIENT_HOVER } from './lib/theme';
import type { Channel } from './types/channel';

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xs px-3 py-10 text-center">
      {icon && (
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/8 bg-white/4 text-slate-500">
          {icon}
        </span>
      )}
      <p className="mt-3.5 text-sm font-semibold text-slate-100">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}


export default function App() {
  const { channels, status, error, reload } = usePlaylist();
  const { favoriteIds, favoriteSet, toggleFavorite, isFavorite } =
    useFavorites();
  const { recentIds, addRecent, clearRecents } = useRecents();

  const [mode, setMode] = useState<ViewMode>('home');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('');
  const [activeCountry, setActiveCountry] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [hideUnavailable, setHideUnavailable] = useState(true);
  const [resultsShown, setResultsShown] = useState(48);
  const [showAllCats, setShowAllCats] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const availabilityVersion = useSyncExternalStore(
    subscribeAvailability,
    getAvailabilityVersion,
    getAvailabilityVersion,
  );

  const deferredSearch = useDeferredValue(search);
  const isLoading = status === 'loading' || status === 'idle';

  const channelById = useMemo(() => {
    const map = new Map<string, Channel>();
    for (const channel of channels) map.set(channel.id, channel);
    return map;
  }, [channels]);

  const isAvailable = useCallback(
    (channel: Channel) =>
      !hideUnavailable || getAvailability(channel.id) !== 'offline',
    [hideUnavailable],
  );

  // ---- Filteran ----
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const channel of channels) {
      if (!channel.group) continue;
      if (/^(undefined|unknown)$/i.test(channel.group)) continue;
      counts.set(channel.group, (counts.get(channel.group) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [channels]);

  // ---- Pilihan filter (tanpa angka, cukup nama) ----
  const groupOptions = useMemo(
    () =>
      categoryOptions.slice(0, 12).map((group) => ({
        value: group.name,
        label: group.name,
      })),
    [categoryOptions],
  );

  const allGroupOptions = useMemo(
    () => categoryOptions.map(({ name }) => ({ value: name, label: name })),
    [categoryOptions],
  );

  const countryOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const channel of channels) {
      if (channel.country) unique.add(channel.country);
    }
    return [...unique]
      .sort((a, b) => countryName(a).localeCompare(countryName(b)))
      .map((code) => ({
        value: code,
        label: countryName(code),
      }));
  }, [channels]);

  const searchResults = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    // Tergantung versi ketersediaan agar channel yang baru terdeteksi offline ikut terfilter
    void availabilityVersion;

    return channels.filter((channel) => {
      if (activeGroup && channel.group !== activeGroup) return false;
      if (activeCountry && channel.country !== activeCountry) return false;
      if (!isAvailable(channel) && channel.id !== selectedId) return false;

      if (term) {
        const haystack = `${channel.name} ${channel.group ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [
    channels,
    activeGroup,
    activeCountry,
    deferredSearch,
    isAvailable,
    selectedId,
    availabilityVersion,
  ]);

  const guideChannels = useMemo(() => {
    void availabilityVersion;
    return channels.filter((channel) => isAvailable(channel));
  }, [channels, isAvailable, availabilityVersion]);

  const favoriteChannels = useMemo(() => {
    void availabilityVersion;
    return favoriteIds
      .map((id) => channelById.get(id))
      .filter((channel): channel is Channel => Boolean(channel))
      .filter(isAvailable);
  }, [favoriteIds, channelById, isAvailable, availabilityVersion]);

  const recentChannels = useMemo(() => {
    void availabilityVersion;
    return recentIds
      .map((id) => channelById.get(id))
      .filter((channel): channel is Channel => Boolean(channel))
      .filter(isAvailable);
  }, [recentIds, channelById, isAvailable, availabilityVersion]);

  const activeId = selectedId && channelById.has(selectedId) ? selectedId : null;
  const selectedChannel = activeId ? (channelById.get(activeId) ?? null) : null;

  useEffect(() => {
    document.title = selectedChannel
      ? `${selectedChannel.name} · OpenTV`
      : 'OpenTV — Live TV dari playlist publik';
  }, [selectedChannel]);

  const handleSelectChannel = useCallback(
    (channel: Channel) => {
      setSelectedId(channel.id);
      addRecent(channel.id);

      // Player TV hanya ada di Beranda — dari view manapun, langsung pulang ke Beranda
      if (mode !== 'home') setMode('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [addRecent, mode],
  );

  const filteredForPrevNext = useMemo(() => {
    const source =
      mode === 'favorites'
        ? favoriteChannels
        : mode === 'recents'
          ? recentChannels
          : searchResults;
    return source.length > 0 ? source : guideChannels;
  }, [mode, favoriteChannels, recentChannels, searchResults, guideChannels]);

  const move = useCallback(
    (offset: number) => {
      if (filteredForPrevNext.length === 0) return;
      const index = filteredForPrevNext.findIndex(
        (channel) => channel.id === activeId,
      );
      const nextIndex =
        (index + offset + filteredForPrevNext.length) %
        filteredForPrevNext.length;
      handleSelectChannel(filteredForPrevNext[nextIndex]);
    },
    [filteredForPrevNext, activeId, handleSelectChannel],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '')
      ) {
        event.preventDefault();
        setMode('search');
        setTimeout(() => {
          document
            .querySelector<HTMLInputElement>('input[type="search"]')
            ?.focus();
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Reset pagination saat filter berubah (di-render, bukan di-effect)
  const filterKey = `${deferredSearch}|${activeGroup}|${activeCountry}`;
  const [renderedFilterKey, setRenderedFilterKey] = useState(filterKey);
  if (renderedFilterKey !== filterKey) {
    setRenderedFilterKey(filterKey);
    setResultsShown(48);
  }

  const hasActiveFilters =
    activeGroup !== '' || activeCountry !== '' || search.trim() !== '';

  const resetFilters = () => {
    setSearch('');
    setActiveGroup('');
    setActiveCountry('');
  };

  const activeIsLive = playerStatus === 'playing';

  // ---- Grid channel ----
  const gridFor = (list: Channel[], showAll = false) => {
    const visible = showAll ? list : list.slice(0, resultsShown);
    const hasMore = !showAll && list.length > visible.length;

    return (
      <>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {visible.map((channel) => (
            <ChannelTile
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeId}
              isLive={channel.id === activeId && activeIsLive}
              onSelect={handleSelectChannel}
            />
          ))}
        </div>
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setResultsShown((count) => count + 48)}
              className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 px-7 py-3 text-sm font-semibold text-white transition-colors ${LIME_GRADIENT_HOVER}`}
            >
              <ChevronDownIcon className="h-4 w-4" />
              Tampilkan lebih banyak
            </button>
          </div>
        )}
      </>
    );
  };

  const renderMode = () => {
    if (mode === 'search') {
      return (
        <section className="fade-in">
          <SearchInput
            value={search}
            onChange={setSearch}
            large
            placeholder="Cari channel TV…"
          />

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <SearchableSelect
              value={activeGroup}
              onChange={setActiveGroup}
              options={allGroupOptions}
              allLabel="Semua kategori"
              placeholder="Cari kategori…"
              icon={<TvIcon className="h-4.5 w-4.5" strokeWidth={2} />}
            />
            <SearchableSelect
              value={activeCountry}
              onChange={setActiveCountry}
              options={countryOptions}
              allLabel="Semua negara"
              placeholder="Cari negara…"
              icon={<GlobeIcon className="h-4.5 w-4.5" strokeWidth={2} />}
            />
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <CategoryChips
              categories={groupOptions}
              activeGroup={activeGroup}
              onGroupSelect={setActiveGroup}
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title="Hapus semua filter"
                className="grid h-8.5 w-8.5 shrink-0 self-start place-items-center rounded-full border border-white/8 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="mt-4 px-1 text-sm text-slate-500">
            {deferredSearch.trim()
              ? `Hasil untuk "${deferredSearch.trim()}"`
              : activeGroup
                ? activeGroup
                : 'Semua channel'}
          </p>

          {searchResults.length > 0 ? (
            gridFor(searchResults)
          ) : (
            <EmptyState
              icon={<SignalOffIcon className="h-6 w-6" />}
              title="Tidak ada channel cocok"
              description="Coba kata kunci lain atau hapus filter kategori dan negara."
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-lg border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
                  >
                    Hapus semua filter
                  </button>
                ) : undefined
              }
            />
          )}
        </section>
      );
    }

    if (mode === 'favorites') {
      return favoriteChannels.length > 0 ? (
        <section className="fade-in">
          {gridFor(favoriteChannels, true)}
        </section>
      ) : (
        <div className="fade-in">
          <EmptyState
            icon={<StarIcon className="h-6 w-6" />}
            title="Belum ada favorit"
            description="Tap ikon bintang pada channel untuk menyimpannya ke sini."
          />
        </div>
      );
    }

    if (mode === 'recents') {
      return recentChannels.length > 0 ? (
        <section className="fade-in">
          <div className="flex items-center justify-end px-1">
            <button
              type="button"
              onClick={clearRecents}
              className="text-xs font-semibold text-slate-500 transition-colors hover:text-rose-300"
            >
              Bersihkan riwayat
            </button>
          </div>
          {gridFor(recentChannels, true)}
        </section>
      ) : (
        <div className="fade-in">
          <EmptyState
            icon={<SignalOffIcon className="h-6 w-6" />}
            title="Riwayat kosong"
            description="Channel yang kamu tonton akan otomatis muncul di sini."
          />
        </div>
      );
    }

    // HOME: hero + strip zapping + baris kategori
    return (
      <section className="fade-in">
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* Kiri: box TV + info ala halaman tonton YouTube */}
          <div
            ref={playerRef}
            className="min-w-0 scroll-mt-24 xl:sticky xl:top-[5.5rem]"
          >
            <VideoPlayer
              channel={selectedChannel}
              canPrev={filteredForPrevNext.length > 1}
              canNext={filteredForPrevNext.length > 1}
              onPrev={() => move(-1)}
              onNext={() => move(1)}
              onStatusChange={setPlayerStatus}
            />

            {selectedChannel && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-ink-900/70 p-3.5">
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase ring-1 ring-inset ${
                    activeIsLive
                      ? 'bg-accent-400/12 text-accent-400 ring-accent-400/30'
                      : 'bg-white/5 text-slate-500 ring-white/10'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeIsLive
                        ? 'animate-pulse bg-accent-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  {activeIsLive ? 'Live' : 'Pilih'}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-base font-bold text-white sm:text-lg">
                    {selectedChannel.name}
                  </h2>
                  <p className="truncate text-xs text-slate-500">
                    {[
                      selectedChannel.group,
                      selectedChannel.country
                        ? countryName(selectedChannel.country)
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sedang diputar di pemutar di atas'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedChannel.id)}
                  aria-pressed={isFavorite(selectedChannel.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                    favoriteSet.has(selectedChannel.id)
                      ? 'border-accent-400/40 bg-accent-400/12 text-accent-400 hover:bg-accent-400/20'
                      : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <StarIcon
                    filled={favoriteSet.has(selectedChannel.id)}
                    className="h-3.5 w-3.5"
                  />
                  {favoriteSet.has(selectedChannel.id) ? 'Tersimpan' : 'Favorit'}
                </button>
              </div>
            )}
          </div>

          {/* Kanan: channel terkait + bar kategori ala YouTube */}
          <aside className="flex h-[64vh] min-h-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-900/70 xl:h-[calc(100dvh-9rem)] xl:min-h-[420px]">
            <div className="flex items-center gap-2 border-b border-white/8 py-2.5 pr-2 pl-3">
              <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
                <CategoryChips
                  categories={groupOptions.slice(0, 10)}
                  activeGroup={activeGroup}
                  onGroupSelect={setActiveGroup}
                />
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAllCats((state) => !state)}
                  aria-expanded={showAllCats}
                  aria-label="Kategori lainnya"
                  title="Kategori lainnya"
                  className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                    showAllCats
                      ? 'bg-white/15 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ChevronRightIcon
                    className={`h-4 w-4 transition-transform ${
                      showAllCats ? 'rotate-90' : ''
                    }`}
                    strokeWidth={2.4}
                  />
                </button>

                {showAllCats && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl shadow-black/70 backdrop-blur-xl">
                    <p className="px-3.5 pt-3 pb-1.5 text-[11px] font-bold tracking-wider text-white/60 uppercase">
                      Kategori
                    </p>
                    <div className="no-scrollbar flex max-h-72 flex-wrap gap-1.5 overflow-y-auto px-2.5 pb-2.5">
                      {categoryOptions.map((category) => {
                        const on = category.name === activeGroup;
                        return (
                          <button
                            key={category.name}
                            type="button"
                            onClick={() => setActiveGroup(on ? '' : category.name)}
                            aria-pressed={on}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                              on
                                ? `font-bold ${LIME_GRADIENT}`
                                : 'bg-white/[.06] text-white/85 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                    {activeGroup && (
                      <div className="border-t border-white/8 p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGroup('');
                            setShowAllCats(false);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                          Hapus kategori
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-1.5">
              <ChannelList
                channels={searchResults}
                activeId={activeId}
                onSelect={handleSelectChannel}
                resetKey={`related|${filterKey}|${hideUnavailable}`}
                empty={
                  status === 'error' ? (
                    <EmptyState
                      icon={<SignalOffIcon className="h-6 w-6" />}
                      title="Playlist gagal dimuat"
                      description={
                        error ??
                        'Tidak dapat mengambil playlist. Periksa koneksi internet lalu coba lagi.'
                      }
                      action={
                        <button
                          type="button"
                          onClick={reload}
                          className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-opacity hover:opacity-90 ${LIME_GRADIENT}`}
                        >
                          Coba lagi
                        </button>
                      }
                    />
                  ) : isLoading ? (
                    <EmptyState
                      title="Memuat playlist"
                      description="Mengunduh daftar channel dari playlist publik."
                    />
                  ) : hasActiveFilters ? (
                    <EmptyState
                      icon={<SignalOffIcon className="h-6 w-6" />}
                      title="Tidak ada yang cocok"
                      description="Tidak ada channel pada filter ini. Hapus filter untuk melihat semua."
                    />
                  ) : (
                    <EmptyState
                      icon={<SignalOffIcon className="h-6 w-6" />}
                      title="Kosong"
                      description="Tidak ada channel yang dapat dijangkau. Coba matikan 'Sembunyikan gagal'."
                    />
                  )
                }
              />
            </div>
          </aside>
        </div>
      </section>
    );
  };

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Ambient glow ala Cinejoy */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[60vh] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(149,255,80,0.06),transparent_70%)]"
      />

      <NavRail
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          if (next !== 'home') window.scrollTo({ top: 0 });
        }}
      />

      <div className="relative z-10 flex min-h-dvh flex-col pb-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:pb-0 lg:pl-[92px]">
        <AppHeader
          title={VIEW_LABELS[mode]}
          isLoading={isLoading}
          hideUnavailable={hideUnavailable}
          onToggleHideUnavailable={() => setHideUnavailable((value) => !value)}
          onReload={reload}
        />

        <div className="mx-auto w-full max-w-[1700px] flex-1 px-3 py-4 sm:px-8">
          {status === 'error' && mode !== 'home' && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-2.5 text-xs text-rose-200">
              <SignalOffIcon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">
                Playlist tidak dapat dimuat{error ? `: ${error}` : '.'}
              </span>
              <button
                type="button"
                onClick={reload}
                className="rounded-md border border-rose-400/30 px-2 py-1 font-medium text-rose-100 transition-colors hover:bg-rose-400/15"
              >
                Coba lagi
              </button>
            </div>
          )}

          {renderMode()}
        </div>

        <div className="mt-auto">
          <AppFooter
            onNavigate={(next) => {
              setMode(next);
              if (next !== 'home') window.scrollTo({ top: 0 });
            }}
          />
        </div>
      </div>
    </div>
  );
}
