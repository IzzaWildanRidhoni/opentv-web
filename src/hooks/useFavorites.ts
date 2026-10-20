import { useCallback, useEffect, useMemo, useState } from 'react';
import { FAVORITES_STORAGE_KEY } from '../lib/config';

function readFavorites(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
}

type UseFavoritesResult = {
  favoriteIds: string[];
  favoriteSet: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;
};

export function useFavorites(): UseFavoritesResult {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavorites);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds),
      );
    } catch {
      // Storage can be unavailable (private mode); favorites stay in memory.
    }
  }, [favoriteIds]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        setFavoriteIds(readFavorites());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const isFavorite = useCallback(
    (id: string) => favoriteSet.has(id),
    [favoriteSet],
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [id, ...current],
    );
  }, []);

  const clearFavorites = useCallback(() => setFavoriteIds([]), []);

  return {
    favoriteIds,
    favoriteSet,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
