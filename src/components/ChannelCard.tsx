import { useState } from 'react';
import { countryName } from '../lib/countries';
import type { Channel } from '../types/channel';
import { StarIcon } from './icons';

type ChannelCardProps = {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (id: string) => void;
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
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: ChannelCardProps) {
  const meta = [channel.group, channel.country ? countryName(channel.country) : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`group relative flex items-center gap-2 rounded-xl border pr-1.5 pl-2 transition-colors ${
        isActive
          ? 'border-accent-400/45 bg-accent-400/10'
          : 'border-transparent hover:border-white/8 hover:bg-white/4'
      }`}
    >
      {isActive && (
        <span className="absolute top-1/2 left-0 h-7 w-0.5 -translate-y-1/2 rounded-full bg-accent-400" />
      )}

      <button
        type="button"
        onClick={() => onSelect(channel)}
        aria-current={isActive ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left"
      >
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
        {isActive && (
          <span className="flex shrink-0 items-center gap-1 pr-1 text-[10px] font-semibold tracking-wide text-accent-300 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
            Live
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(channel.id)}
        aria-label={
          isFavorite
            ? `Hapus ${channel.name} dari favorit`
            : `Tambah ${channel.name} ke favorit`
        }
        title={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
          isFavorite
            ? 'text-amber-400 hover:bg-amber-400/10'
            : 'text-slate-600 hover:bg-white/8 hover:text-slate-300'
        }`}
      >
        <StarIcon filled={isFavorite} className="h-4 w-4" />
      </button>
    </div>
  );
}
