import { useCallback, useEffect, useMemo, useState } from 'react';
import { RECENTS_LIMIT, RECENTS_STORAGE_KEY } from '../lib/config';

function readRecents(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is string => typeof entry === 'string')
      .slice(0, RECENTS_LIMIT);
  } catch {
    return [];
  }
}

type UseRecentsResult = {
  recentIds: string[];
  recentSet: Set<string>;
  addRecent: (id: string) => void;
  removeRecent: (id: string) => void;
  clearRecents: () => void;
};

export function useRecents(): UseRecentsResult {
  const [recentIds, setRecentIds] = useState<string[]>(readRecents);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RECENTS_STORAGE_KEY,
        JSON.stringify(recentIds),
      );
    } catch {
      // Storage can be unavailable (private mode); recents stay in memory.
    }
  }, [recentIds]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RECENTS_STORAGE_KEY) {
        setRecentIds(readRecents());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const recentSet = useMemo(() => new Set(recentIds), [recentIds]);

  const addRecent = useCallback((id: string) => {
    setRecentIds((current) =>
      [id, ...current.filter((entry) => entry !== id)].slice(0, RECENTS_LIMIT),
    );
  }, []);

  const removeRecent = useCallback((id: string) => {
    setRecentIds((current) => current.filter((entry) => entry !== id));
  }, []);

  const clearRecents = useCallback(() => setRecentIds([]), []);

  return {
    recentIds,
    recentSet,
    addRecent,
    removeRecent,
    clearRecents,
  };
}
