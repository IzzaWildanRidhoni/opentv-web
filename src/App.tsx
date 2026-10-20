import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppHeader } from './components/AppHeader';
import { ChannelFilters, type ChannelView } from './components/ChannelFilters';
import { ChannelList } from './components/ChannelList';
import { QuickFilters } from './components/QuickFilters';
import { VideoPlayer } from './components/VideoPlayer';
import { RefreshIcon, SignalOffIcon, SpinnerIcon, StarIcon } from './components/icons';
import { useFavorites } from './hooks/useFavorites';
import { usePlaylist } from './hooks/usePlaylist';
import { countryName } from './lib/countries';
import type { Channel } from './types/channel';

const PLAYLIST_LABEL = 'iptv-org.github.io';

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xs px-3 py-6 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/8 bg-white/4 text-slate-500">
        {icon}
      </span>
      <p className="mt-3.5 text-sm font-semibold text-slate-200">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export default function App() {
  const { channels, status, error, reload } = usePlaylist();
  const { favoriteIds, favoriteSet, toggleFavorite } = useFavorites();

  const [search, setSearch] = useState('');
  const [view, setView] = useState<ChannelView>('all');
  const [activeGroup, setActiveGroup] = useState('');
  const [activeCountry, setActiveCountry] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const deferredSearch = useDeferredValue(search);
  const isLoading = status === 'loading' || status === 'idle';

  const channelById = useMemo(() => {
    const map = new Map<string, Channel>();
    for (const channel of channels) map.set(channel.id, channel);
    return map;
  }, [channels]);

  const groups = useMemo(() => {
    const unique = new Set<string>();
    for (const channel of channels) {
      if (channel.group) unique.add(channel.group);
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [channels]);

  const countries = useMemo(() => {
    const unique = new Set<string>();
    for (const channel of channels) {
      if (channel.country) unique.add(channel.country);
    }
    return [...unique].sort((a, b) =>
      countryName(a).localeCompare(countryName(b)),
    );
  }, [channels]);

  const topGroups = useMemo(() => {
    const counts = new Map<string, number>();

    for (const channel of channels) {
      if (!channel.group) continue;
      if (/^(undefined|unknown)$/i.test(channel.group)) continue;
      counts.set(channel.group, (counts.get(channel.group) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([name, count]) => ({ name, count }));
  }, [channels]);

  const indonesiaCount = useMemo(
    () => channels.filter((channel) => channel.country === 'ID').length,
    [channels],
  );

  const filteredChannels = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    return channels.filter((channel) => {
      if (view === 'favorites' && !favoriteSet.has(channel.id)) return false;
      if (activeGroup && channel.group !== activeGroup) return false;
      if (activeCountry && channel.country !== activeCountry) return false;

      if (term) {
        const haystack = `${channel.name} ${channel.group ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [channels, view, favoriteSet, activeGroup, activeCountry, deferredSearch]);

  const activeId =
    selectedId && channelById.has(selectedId) ? selectedId : null;
  const selectedChannel = activeId ? (channelById.get(activeId) ?? null) : null;

  useEffect(() => {
    document.title = selectedChannel
      ? `${selectedChannel.name} · OpenTV`
      : 'OpenTV — Live TV dari playlist publik';
  }, [selectedChannel]);

  const filteredIndex = filteredChannels.findIndex(
    (channel) => channel.id === activeId,
  );

  const move = (offset: number) => {
    if (filteredChannels.length === 0) return;

    const base = filteredIndex === -1 ? 0 : filteredIndex;
    const nextIndex =
      (base + offset + filteredChannels.length) % filteredChannels.length;

    setSelectedId(filteredChannels[nextIndex].id);
  };

  const hasActiveFilters =
    activeGroup !== '' || activeCountry !== '' || search.trim() !== '';

  const handleSelect = (channel: Channel) => {
    setSelectedId(channel.id);

    const player = playerRef.current;
    if (!player || !window.matchMedia('(max-width: 1023px)').matches) return;

    const rect = player.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      player.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const resetFilters = () => {
    setSearch('');
    setActiveGroup('');
    setActiveCountry('');
  };

  const listResetKey = `${view}|${activeGroup}|${activeCountry}|${deferredSearch}`;

  const emptyState = (() => {
    if (status === 'error') {
      return (
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-400 px-3.5 py-2 text-xs font-semibold text-ink-950 transition-colors hover:bg-accent-300"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          }
        />
      );
    }

    if (isLoading) {
      return (
        <EmptyState
          icon={<SpinnerIcon className="h-6 w-6 animate-spin text-accent-400" />}
          title="Memuat playlist"
          description="Mengunduh dan membaca daftar channel dari playlist publik. Ini bisa memakan beberapa detik."
        />
      );
    }

    if (view === 'favorites' && favoriteIds.length === 0) {
      return (
        <EmptyState
          icon={<StarIcon className="h-6 w-6" />}
          title="Belum ada favorit"
          description="Tekan ikon bintang pada channel untuk menyimpannya. Favorit disimpan di browser ini."
        />
      );
    }

    return (
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
    );
  })();

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950">
      <AppHeader
        search={search}
        onSearchChange={setSearch}
        total={channels.length}
        isLoading={isLoading}
        onReload={reload}
      />

      {status === 'error' && (
        <div className="border-b border-rose-500/20 bg-rose-500/8">
          <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-2 px-3 py-2 text-xs text-rose-200 sm:px-5">
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
        </div>
      )}

      <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:gap-5 lg:py-5">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div ref={playerRef} className="scroll-mt-28">
            <VideoPlayer
              channel={selectedChannel}
              canPrev={filteredChannels.length > 1}
              canNext={filteredChannels.length > 1}
              onPrev={() => move(-1)}
              onNext={() => move(1)}
            />
          </div>

          <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-3.5 sm:p-4">
            {selectedChannel ? (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Sedang dipilih
                  </p>
                  <h1 className="mt-1 truncate text-base font-semibold text-white sm:text-lg">
                    {selectedChannel.name}
                  </h1>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {[
                      selectedChannel.group,
                      selectedChannel.country
                        ? countryName(selectedChannel.country)
                        : '',
                      selectedChannel.country,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Metadata channel tidak lengkap'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedChannel.id)}
                  aria-pressed={favoriteSet.has(selectedChannel.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    favoriteSet.has(selectedChannel.id)
                      ? 'border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/15'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <StarIcon
                    filled={favoriteSet.has(selectedChannel.id)}
                    className="h-3.5 w-3.5"
                  />
                  {favoriteSet.has(selectedChannel.id)
                    ? 'Favorit'
                    : 'Tambah favorit'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <SpinnerIcon className="h-5 w-5 shrink-0 animate-spin text-accent-400" />
                ) : (
                  <SignalOffIcon className="h-5 w-5 shrink-0 text-slate-500" />
                )}
                <p className="text-sm text-slate-400">
                  {isLoading
                    ? 'Menyiapkan daftar channel…'
                    : status === 'error'
                      ? 'Playlist tidak tersedia saat ini.'
                      : 'Pilih channel dari daftar untuk mulai menonton.'}
                </p>
              </div>
            )}
          </div>

          <QuickFilters
            groups={topGroups}
            activeGroup={activeGroup}
            onGroupSelect={(group) => {
              setView('all');
              setActiveGroup(group);
            }}
            indonesiaCount={indonesiaCount}
            indonesiaActive={activeCountry === 'ID'}
            onIndonesiaToggle={() => {
              setView('all');
              setActiveCountry(activeCountry === 'ID' ? '' : 'ID');
            }}
          />
        </div>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-[4.75rem] lg:h-[calc(100dvh-6rem)] lg:w-[384px] lg:shrink-0 xl:w-[420px]">
          <div className="rounded-2xl border border-white/8 bg-ink-900/70 p-3">
            <ChannelFilters
              view={view}
              onViewChange={setView}
              groups={groups}
              activeGroup={activeGroup}
              onGroupChange={setActiveGroup}
              countries={countries}
              activeCountry={activeCountry}
              onCountryChange={setActiveCountry}
              favoriteCount={favoriteIds.length}
              resultCount={filteredChannels.length}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          </div>

          <div className="h-[68dvh] overflow-hidden rounded-2xl border border-white/8 bg-ink-900/40 p-1.5 lg:h-auto lg:min-h-0 lg:flex-1">
            <ChannelList
              channels={filteredChannels}
              activeId={activeId}
              favoriteSet={favoriteSet}
              onSelect={handleSelect}
              onToggleFavorite={toggleFavorite}
              resetKey={listResetKey}
              empty={emptyState}
            />
          </div>
        </aside>
      </main>

      <footer className="mt-2 border-t border-white/6 bg-ink-950 px-3 py-4 sm:px-5">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 text-[11px] leading-relaxed text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl">
            Sumber channel berasal dari playlist publik{' '}
            <a
              href="https://github.com/iptv-org/iptv"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-400 underline decoration-white/20 underline-offset-2 transition-colors hover:text-accent-300"
            >
              {PLAYLIST_LABEL}
            </a>
            . Ketersediaan stream dan hak siar sepenuhnya bergantung pada
            masing-masing penyedia. Sebagian channel mungkin tidak dapat diputar
            karena sedang offline, geo-blocking, atau format yang tidak didukung
            browser.
          </p>
          <p className="shrink-0 text-slate-600">
            OpenTV · dibuat untuk playlist publik
          </p>
        </div>
      </footer>
    </div>
  );
}
