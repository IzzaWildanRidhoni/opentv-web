import type { Channel } from '../types/channel';
import { isNativeVideoUrl } from './player';

export type Availability = 'online' | 'offline';

type Entry = { status: Availability; at: number };

const STORAGE_KEY = 'opentv:availability:v1';
const TTL_MS = 12 * 60 * 60 * 1000;
const MAX_ENTRIES = 8000;
const PROBE_TIMEOUT_MS = 7000;
const CONCURRENCY = 3;
const MAX_MANIFEST_BYTES = 96 * 1024;
const UNSUPPORTED_PATTERN = /\.(?:mpd|flv|ts|2ts|smil|htm|html)(?:$|\?)/i;

const entries = new Map<string, Entry>();
const pending = new Set<string>();
const controllers = new Map<string, AbortController>();
const queue: Channel[] = [];
const listeners = new Set<() => void>();

let hydrated = false;
let activeChecks = 0;
let version = 0;
let generation = 0;
let persistTimer: number | null = null;

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    const now = Date.now();
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;

      const { status, at } = value as { status?: unknown; at?: unknown };
      if (
        (status === 'online' || status === 'offline') &&
        typeof at === 'number' &&
        now - at < TTL_MS
      ) {
        entries.set(id, { status, at });
      }
    }
  } catch {
    // Corrupt or unavailable storage: start with an empty cache.
  }
}

function persist() {
  if (typeof window === 'undefined') return;

  if (persistTimer !== null) window.clearTimeout(persistTimer);

  persistTimer = window.setTimeout(() => {
    persistTimer = null;

    try {
      if (entries.size > MAX_ENTRIES) {
        const oldest = [...entries.entries()].sort(
          (a, b) => a[1].at - b[1].at,
        );
        for (const [id] of oldest.slice(0, entries.size - MAX_ENTRIES)) {
          entries.delete(id);
        }
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Object.fromEntries(entries)),
      );
    } catch {
      // Storage can be full or disabled; the in-memory cache still works.
    }
  }, 600);
}

export function getAvailability(id: string): Availability | undefined {
  hydrate();

  const entry = entries.get(id);
  if (!entry) return undefined;

  if (Date.now() - entry.at > TTL_MS) {
    entries.delete(id);
    return undefined;
  }

  return entry.status;
}

export function getAvailabilityVersion(): number {
  return version;
}

export function subscribeAvailability(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setAvailability(id: string, status: Availability) {
  const current = entries.get(id);
  if (
    current &&
    current.status === status &&
    Date.now() - current.at < TTL_MS
  ) {
    return;
  }

  entries.set(id, { status, at: Date.now() });
  persist();
  emit();
}

export function reportAvailable(id: string) {
  setAvailability(id, 'online');
}

export function reportUnavailable(id: string) {
  setAvailability(id, 'offline');
}

export function resetAvailability() {
  hydrate();

  generation += 1;
  for (const controller of controllers.values()) controller.abort();
  controllers.clear();
  pending.clear();
  queue.length = 0;
  entries.clear();

  persist();
  emit();
}

async function checkStream(channel: Channel): Promise<Availability> {
  const controller = new AbortController();
  controllers.set(channel.id, controller);

  const timeout = window.setTimeout(
    () => controller.abort(),
    PROBE_TIMEOUT_MS,
  );

  try {
    const response = await fetch(channel.url, {
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
      headers: {
        Accept:
          'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*',
      },
    });

    if (!response.ok) return 'offline';
    if (!response.body) {
      return (await response.text()).includes('#EXTM3U') ? 'online' : 'offline';
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let head = '';

    try {
      while (received < MAX_MANIFEST_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;

        received += value.byteLength;
        head += decoder.decode(value, { stream: true });

        if (head.includes('#EXTM3U')) break;
      }
    } finally {
      try {
        await reader.cancel();
      } catch {
        // The response may already be closed.
      }
    }

    return head.includes('#EXTM3U') ? 'online' : 'offline';
  } catch {
    return 'offline';
  } finally {
    window.clearTimeout(timeout);
    controllers.delete(channel.id);
  }
}

function pump() {
  while (activeChecks < CONCURRENCY && queue.length > 0) {
    const channel = queue.shift();
    if (!channel) return;

    activeChecks += 1;
    const checkGeneration = generation;

    void checkStream(channel)
      .then((status) => {
        if (checkGeneration !== generation) return;
        setAvailability(channel.id, status);
      })
      .finally(() => {
        pending.delete(channel.id);
        activeChecks -= 1;
        pump();
      });
  }
}

export function ensureAvailabilityCheck(channel: Channel) {
  hydrate();

  if (isNativeVideoUrl(channel.url)) return;
  if (getAvailability(channel.id) !== undefined) return;
  if (pending.has(channel.id)) return;

  if (UNSUPPORTED_PATTERN.test(channel.url)) {
    setAvailability(channel.id, 'offline');
    return;
  }

  pending.add(channel.id);
  queue.push(channel);
  pump();
}
