export type Channel = {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  country?: string;
  tvgId?: string;
  isFavorite?: boolean;
};

export type PlaylistStatus = 'idle' | 'loading' | 'ready' | 'error';
