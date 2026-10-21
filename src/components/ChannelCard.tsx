import { useEffect, useRef, useState } from 'react';
import { ensureAvailabilityCheck } from '../lib/availability';
import { countryName } from '../lib/countries';
import type { Channel } from '../types/channel';

type ChannelCardProps = {
  channel: Channel;
  number?: number;
  isActive: boolean;
  onSelect: (channel: Channel) => void;
};

const AVATAR_TONES = [
  'from-cyan-500/70 to-blue-600/70',
  'from-violet-500/70 to-fuchsia-600/70',
  'from-emerald-500/70 to-teal-600/70',
  'from-amber-500/70 to-orange-600/70',
  'from-rose-500/70 to-pink-600/70',
  'from-sky-500/70 to-indigo-600/70',
];

function toneFor(id: string): string {
  let sum = 0;
  for (let index = 0; index < id.length; index += 1) {
    sum = (sum + id.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[sum];
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

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/8 bg-ink-800">
      {showImage ? (
        <img
          src={channel.logo}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedLogo(channel.logo ?? null)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center bg-gradient-to-br text-[11px] font-bold text-white/90 ${toneFor(
            channel.id,
          )}`}
        >
          {initialsFor(channel.name)}
        </span>
      )}
    </span>
  );
}

export function ChannelCard({
  channel,
  number,
  isActive,
  onSelect,
}: ChannelCardProps) {
  const meta = [channel.group, channel.country ? countryName(channel.country) : '']
    .filter(Boolean)
    .join(' · ');

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
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
      { rootMargin: '120px' },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [channel]);

  return (
    <div
      ref={cardRef}
      className={`group relative flex items-center gap-2 rounded-xl border pr-1.5 pl-2 transition-colors ${
        isActive
          ? 'border-white/10 bg-white/[.06]'
          : 'border-transparent hover:border-white/8 hover:bg-white/4'
      }`}
    >

      <button
        type="button"
        onClick={() => onSelect(channel)}
        aria-current={isActive ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left"
      >
        {number !== undefined && (
          <span className="w-6 shrink-0 text-center text-[11px] font-bold text-slate-500 tabular-nums">
            {number}
          </span>
        )}
        <ChannelLogo channel={channel} />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[13.5px] font-medium ${
              isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
            }`}
          >
            {channel.name}
          </span>
        {meta && (
          <span className="mt-0.5 block truncate text-[11.5px] text-slate-500">
            {meta}
          </span>
        )}
        </span>
      </button>
    </div>
  );
}
