import { useEffect, useState, type ReactNode } from 'react';
import type { Channel } from '../types/channel';
import { LIME_GRADIENT_HOVER } from '../lib/theme';
import { ChannelCard } from './ChannelCard';
import { ChevronDownIcon } from './icons';

const PAGE_SIZE = 120;

type ChannelListProps = {
  channels: Channel[];
  activeId: string | null;
  onSelect: (channel: Channel) => void;
  resetKey?: string;
  empty?: ReactNode;
};

export function ChannelList({
  channels,
  activeId,
  onSelect,
  resetKey,
  empty,
}: ChannelListProps) {
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [resetKey]);

  if (channels.length === 0) return <>{empty}</>;

  const visible = channels.slice(0, shown);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {visible.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            isActive={channel.id === activeId}
            onSelect={onSelect}
          />
        ))}
      </div>

      {shown < channels.length && (
        <div className="p-2">
          <button
            type="button"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2.5 text-xs font-semibold text-white transition-colors ${LIME_GRADIENT_HOVER}`}
          >
            <ChevronDownIcon className="h-4 w-4" />
            Tampilkan lebih banyak
          </button>
        </div>
      )}
    </div>
  );
}
