import { useEffect, useRef, useState } from 'react';
import { ensureAvailabilityCheck } from '../lib/availability';
import { LIME_GRADIENT } from '../lib/theme';
import type { Channel } from '../types/channel';
import { PlayIcon } from './icons';

type ChannelTileProps = {
  channel: Channel;
  isActive: boolean;
  isLive: boolean;
  onSelect: (channel: Channel) => void;
};

function hueOf(seed: string): number {
  let hue = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hue = (hue * 31 + seed.charCodeAt(index)) % 360;
  }
  return hue;
}

function initialsFor(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'TV';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}

function ChannelLogo({ channel }: { channel: Channel }) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const showImage = Boolean(channel.logo) && failedLogo !== channel.logo;
  const hue = hueOf(channel.id);

  return (
    <span
      className="grid h-full w-full place-items-center p-5"
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 42% 17%), hsl(${(hue + 45) % 360} 38% 7%))`,
      }}
    >
      {showImage ? (
        <img
          src={channel.logo}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedLogo(channel.logo ?? null)}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="font-display text-sm font-bold text-white/80 drop-shadow">
          {initialsFor(channel.name)}
        </span>
      )}
    </span>
  );
}

export function ChannelTile({
  channel,
  isActive,
  isLive,
  onSelect,
}: ChannelTileProps) {
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = tileRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      ensureAvailabilityCheck(channel);
      return;
    }

    const observer = new IntersectionObserver(
      (observed) => {
        if (observed.some((entry) => entry.isIntersecting)) {
          ensureAvailabilityCheck(channel);
          observer.disconnect();
        }
      },
      { rootMargin: '160px' },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [channel]);

  return (
    <div ref={tileRef} className="relative">
      <button
        type="button"
        onClick={() => onSelect(channel)}
        aria-current={isActive ? 'true' : undefined}
        className="group block w-full text-left"
      >
        <div
          className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl transition-all duration-300 ${
            isActive
              ? 'ring-2 ring-accent-400/70'
              : 'group-hover:-translate-y-1 group-hover:shadow-[0_16px_36px_-16px_rgba(149,255,80,0.25)]'
          }`}
        >
          <ChannelLogo channel={channel} />

          {/* Saat dipilih: equalizer */}
          {isActive && (
            <span
              className="absolute bottom-3 left-3 inline-flex h-7 items-end gap-[3px] rounded-full bg-black/60 px-3 pt-1.5 pb-2 backdrop-blur"
              role="img"
              aria-label={isLive ? 'Sedang tayang' : 'Sedang dipilih'}
            >
              <i className={isLive ? 'eq-bar' : 'eq-bar bg-slate-400!'} />
              <i
                className={isLive ? 'eq-bar' : 'eq-bar bg-slate-400!'}
                style={{ animationDelay: '0.2s' }}
              />
              <i
                className={isLive ? 'eq-bar' : 'eq-bar bg-slate-400!'}
                style={{ animationDelay: '0.4s' }}
              />
            </span>
          )}

          {/* Hover: tombol putar */}
          <span
            className={`absolute right-2.5 bottom-2.5 grid h-9 w-9 scale-75 place-items-center rounded-full opacity-0 shadow-none transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 ${LIME_GRADIENT}`}
          >
            <PlayIcon className="ml-0.5 h-4 w-4" />
          </span>
        </div>

        <p className="mt-2.5 truncate text-sm font-semibold text-slate-100 group-hover:text-white">
          {channel.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {channel.group || 'Lainnya'}
        </p>
      </button>
    </div>
  );
}
