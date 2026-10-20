import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYLIST_SOURCES } from '../lib/config';
import { parseM3U } from '../lib/m3uParser';
import type { Channel, PlaylistStatus } from '../types/channel';

type UsePlaylistResult = {
  channels: Channel[];
  status: PlaylistStatus;
  error: string | null;
  reload: () => void;
};

async function fetchPlaylist(signal: AbortSignal): Promise<string> {
  let lastError: unknown = null;

  for (const source of PLAYLIST_SOURCES) {
    try {
      const response = await fetch(source, {
        signal,
        headers: { Accept: 'application/x-mpegURL, text/plain, */*' },
      });

      if (!response.ok) {
        throw new Error(`Playlist merespons dengan status ${response.status}.`);
      }

      const text = await response.text();
      if (text.trim().length === 0) {
        throw new Error('Playlist kosong.');
      }

      if (!text.includes('#EXTINF')) {
        throw new Error('Sumber tidak mengembalikan playlist M3U yang valid.');
      }

      return text;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
    }
  }

  throw lastError ?? new Error('Playlist tidak dapat dimuat.');
}

export function usePlaylist(): UsePlaylistResult {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [status, setStatus] = useState<PlaylistStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    let active = true;

    setStatus('loading');
    setError(null);

    fetchPlaylist(controller.signal)
      .then((text) => {
        if (!active) return;

        const parsed = parseM3U(text);
        if (parsed.length === 0) {
          throw new Error('Playlist berhasil diunduh tetapi tidak berisi channel.');
        }

        setChannels(parsed);
        setStatus('ready');
      })
      .catch((reason: unknown) => {
        if (!active || controller.signal.aborted) return;

        setChannels([]);
        setStatus('error');
        setError(
          reason instanceof Error
            ? reason.message
            : 'Playlist gagal dimuat. Periksa koneksi lalu coba lagi.',
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { channels, status, error, reload };
}
