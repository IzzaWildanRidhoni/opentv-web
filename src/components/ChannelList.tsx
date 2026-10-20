import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Channel } from '../types/channel';
import { ChannelCard } from './ChannelCard';
import { ChevronDownIcon } from './icons';

const PAGE_SIZE = 120;

type ChannelListProps = {
  channels: Channel[];
  activeId: string | null;
  favoriteSet: Set<string>;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (id: string) => void;
  resetKey: string;
  empty: ReactNode;
};

export function ChannelList({
  channels,
  activeId,
  favoriteSet,
  onSelect,
  onToggleFavorite,
  resetKey,
  empty,
}: ChannelListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [renderedKey, setRenderedKey] = useState(resetKey);
  const listRef = useRef<HTMLDivElement>(null);

  if (renderedKey !== resetKey) {
    setRenderedKey(resetKey);
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  useEffect(() => {
    if (!activeId) return;

    const container = listRef.current;
    const target = container?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    if (targetRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - targetRect.top;
    } else if (targetRect.bottom > containerRect.bottom) {
      container.scrollTop += targetRect.bottom - containerRect.bottom;
    }
  }, [activeId]);

  if (channels.length === 0) {
    return <div className="grid min-h-40 place-items-center px-4 py-8">{empty}</div>;
  }

  const visibleChannels = channels.slice(0, visibleCount);
  const remaining = channels.length - visibleChannels.length;

  return (
    <div ref={listRef} className="h-full overflow-y-auto pr-0.5">
      <div className="space-y-0.5 pb-3">
        {visibleChannels.map((channel) => (
          <div key={channel.id} data-active={channel.id === activeId}>
            <ChannelCard
              channel={channel}
              isActive={channel.id === activeId}
              isFavorite={favoriteSet.has(channel.id)}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white"
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
          Muat {Math.min(remaining, PAGE_SIZE)} dari {remaining.toLocaleString('id-ID')} channel lainnya
        </button>
      )}
    </div>
  );
}
