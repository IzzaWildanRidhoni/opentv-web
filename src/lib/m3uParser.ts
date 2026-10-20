import type { Channel } from '../types/channel';

const ATTRIBUTE_PATTERN = /([\w-]+)="([^"]*)"/g;
const COUNTRY_PATTERN = /^[a-z]{2}$/i;

function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function findTitleIndex(line: string): number {
  let inQuotes = false;
  let lastComma = -1;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      lastComma = index;
    }
  }

  return lastComma;
}

function readAttributes(metadata: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  ATTRIBUTE_PATTERN.lastIndex = 0;

  for (const match of metadata.matchAll(ATTRIBUTE_PATTERN)) {
    attributes[match[1].toLowerCase()] = match[2].trim();
  }

  return attributes;
}

function countryFromTvgId(tvgId: string | undefined): string | undefined {
  if (!tvgId) return undefined;

  const base = tvgId.split('@')[0];
  const suffix = base.slice(base.lastIndexOf('.') + 1).trim();

  return COUNTRY_PATTERN.test(suffix) ? suffix.toUpperCase() : undefined;
}

function normalizeGroup(groupTitle: string | undefined): string | undefined {
  if (!groupTitle) return undefined;

  const primary = groupTitle
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);

  return primary;
}

function looksLikeStreamUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function parseM3U(text: string): Channel[] {
  const channels: Channel[] = [];
  const seen = new Set<string>();

  let pending: { name: string; attributes: Record<string, string> } | null = null;

  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) continue;

    if (line.startsWith('#EXTINF:')) {
      const payload = line.slice('#EXTINF:'.length);
      const titleIndex = findTitleIndex(payload);
      const metadata = titleIndex >= 0 ? payload.slice(0, titleIndex) : payload;
      const title = titleIndex >= 0 ? payload.slice(titleIndex + 1).trim() : '';

      const attributes = readAttributes(metadata);
      const name = attributes['tvg-name'] || title || 'Unknown channel';

      pending = { name, attributes };
      continue;
    }

    if (line.startsWith('#')) continue;

    if (!pending || !looksLikeStreamUrl(line)) {
      continue;
    }

    const { name, attributes } = pending;
    const tvgId = attributes['tvg-id'] || undefined;
    const logo = attributes['tvg-logo'] || undefined;
    const group = normalizeGroup(attributes['group-title']);
    const country =
      attributes['tvg-country']?.toUpperCase() || countryFromTvgId(tvgId);

    const id = hashString(`${tvgId ?? name}::${line}`);

    pending = null;

    if (seen.has(id)) continue;
    seen.add(id);

    channels.push({
      id,
      name,
      url: line,
      logo,
      group,
      country,
      tvgId,
    });
  }

  return channels;
}
