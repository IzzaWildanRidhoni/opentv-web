import type { Channel } from '../types/channel';
import { ChannelTile } from './ChannelTile';
import { ChevronRightIcon } from './icons';

type ChannelCarouselProps = {
  title: string;
  channels: Channel[];
  activeId: string | null;
  activeIsLive: boolean;
  onSelect: (channel: Channel) => void;
  onSeeAll?: () => void;
};

export function ChannelCarousel({
  title,
  channels,
  activeId,
  activeIsLive,
  onSelect,
  onSeeAll,
}: ChannelCarouselProps) {
  if (channels.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-display truncate text-lg font-extrabold tracking-tight text-white">
          {title}
        </h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-400 transition-colors hover:text-accent-300"
          >
            Lihat semua
            <ChevronRightIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="no-scrollbar -mx-3 mt-3 flex gap-3 overflow-x-auto px-3 pb-2">
        {channels.map((channel) => (
          <div key={channel.id} className="w-52 shrink-0 sm:w-60">
            <ChannelTile
              channel={channel}
              isActive={channel.id === activeId}
              isLive={channel.id === activeId && activeIsLive}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
