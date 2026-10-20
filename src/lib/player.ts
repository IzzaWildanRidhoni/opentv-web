const HLS_PATTERN = /\.m3u8(?:$|\?)/i;
const NATIVE_PATTERN = /\.(?:mp4|m4v|webm|ogv|ogg|mov)(?:$|\?)/i;

export function isHlsUrl(url: string): boolean {
  return HLS_PATTERN.test(url);
}

export function isNativeVideoUrl(url: string): boolean {
  return NATIVE_PATTERN.test(url);
}

export function canPlayHlsNatively(): boolean {
  if (typeof document === 'undefined') return false;

  const video = document.createElement('video');
  return (
    video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    video.canPlayType('application/x-mpegURL') !== ''
  );
}

export function formatError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Terjadi kesalahan yang tidak diketahui.';
}
