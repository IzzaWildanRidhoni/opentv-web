import type Hls from 'hls.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { reportAvailable, reportUnavailable } from '../lib/availability';
import { countryName } from '../lib/countries';
import { canPlayHlsNatively, isHlsUrl, isNativeVideoUrl } from '../lib/player';
import type { Channel } from '../types/channel';
import {
  FullscreenIcon,
  MuteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RefreshIcon,
  SignalOffIcon,
  SpinnerIcon,
  VolumeIcon,
} from './icons';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

type VideoPlayerProps = {
  channel: Channel | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onStatusChange?: (status: PlayerStatus) => void;
};

function nativeErrorMessage(code: number | undefined): string {
  switch (code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Pemutaran dibatalkan.';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'Jaringan terputus saat memuat stream.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'Stream tidak dapat didekode oleh browser ini.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'Format stream tidak didukung browser ini.';
    default:
      return 'Stream tidak dapat diputar.';
  }
}

const READY_TIMEOUT_MS = 14_000;

export function VideoPlayer({
  channel,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onStatusChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
      hideTimerRef.current = null;
    }, 3200);
  }, [clearHideTimer]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (videoRef.current && !videoRef.current.paused) {
      scheduleHide();
    }
  }, [scheduleHide]);

  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    onStatusChangeRef.current?.(status);
  }, [status]);

  useEffect(() => {
    if (status === 'playing') {
      scheduleHide();
    } else {
      clearHideTimer();
      setControlsVisible(true);
    }

    return clearHideTimer;
  }, [status, scheduleHide, clearHideTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!channel) {
      video.removeAttribute('src');
      video.load();
      setStatus('idle');
      setError(null);
      return;
    }

    let hls: Hls | null = null;
    let disposed = false;
    let failed = false;
    let readyTimer: number | null = null;

    setStatus('loading');
    setError(null);

    const clearReadyTimer = () => {
      if (readyTimer !== null) {
        window.clearTimeout(readyTimer);
        readyTimer = null;
      }
    };

    const play = () => {
      void video.play().catch(() => {
        if (!disposed && !failed) setStatus('paused');
      });
    };

    const fail = (message: string) => {
      if (disposed) return;
      failed = true;
      clearReadyTimer();
      reportUnavailable(channel.id);
      setError(message);
      setStatus('error');
    };

    readyTimer = window.setTimeout(() => {
      readyTimer = null;
      if (disposed) return;
      if (video.readyState >= 2 || video.buffered.length > 0) return;

      fail('Stream tidak merespons. Saluran mungkin offline atau kodeknya tidak didukung.');
      hls?.destroy();
      hls = null;
    }, READY_TIMEOUT_MS);

    const attachHls = async (): Promise<boolean> => {
      if (!(isHlsUrl(channel.url) || !isNativeVideoUrl(channel.url))) {
        return false;
      }

      const { default: HlsPlayer } = await import('hls.js');
      if (disposed) return true;
      if (!HlsPlayer.isSupported()) return false;

      const instance = new HlsPlayer({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
      });

      hls = instance;

      instance.on(HlsPlayer.Events.MANIFEST_PARSED, play);
      instance.on(HlsPlayer.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === HlsPlayer.ErrorTypes.NETWORK_ERROR) {
          fail('Stream tidak dapat dijangkau. Saluran mungkin sedang offline.');
        } else if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR) {
          fail('Stream tidak dapat didekode oleh browser ini.');
        } else {
          fail('Stream tidak dapat diputar.');
        }

        instance.destroy();
        if (hls === instance) hls = null;
      });

      instance.loadSource(channel.url);
      instance.attachMedia(video);

      return true;
    };

    void attachHls().then((attached) => {
      if (disposed || attached) return;

      if (isHlsUrl(channel.url) && !canPlayHlsNatively()) {
        fail('Browser ini tidak mendukung pemutaran HLS.');
        return;
      }

      video.src = channel.url;
      play();
    });

    const handlePlaying = () => {
      if (!disposed) {
        clearReadyTimer();
        reportAvailable(channel.id);
        setStatus('playing');
      }
    };
    const handlePause = () => {
      if (!disposed) setStatus('paused');
    };
    const handleWaiting = () => {
      if (!disposed) setStatus('loading');
    };
    const handleVolume = () => {
      if (disposed) return;
      setMuted(video.muted);
      setVolume(video.muted ? 0 : video.volume);
    };
    const handleNativeError = () => {
      if (disposed) return;
      fail(nativeErrorMessage(video.error?.code));
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('volumechange', handleVolume);
    video.addEventListener('error', handleNativeError);

    return () => {
      disposed = true;
      clearReadyTimer();

      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('volumechange', handleVolume);
      video.removeEventListener('error', handleNativeError);

      if (hls) {
        hls.destroy();
      } else {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [channel, retryKey]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    if (video.paused) {
      void video.play().catch(() => setStatus('paused'));
      revealControls();
    } else {
      video.pause();
    }
  }, [channel, revealControls]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) {
      video.volume = 0.6;
    }
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setMuted(value === 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else if (shell.requestFullscreen) {
      void shell.requestFullscreen().catch(() => {});
    }
  }, []);

  const handleRetry = useCallback(() => {
    setRetryKey((key) => key + 1);
  }, []);

  const meta = channel
    ? [channel.group, channel.country ? countryName(channel.country) : '']
        .filter(Boolean)
        .join(' · ')
    : '';

  const controlsShown = controlsVisible || status !== 'playing';

  return (
    <section
      ref={shellRef}
      aria-label="Pemutar video"
      onMouseMove={revealControls}
      onFocus={revealControls}
      className="group relative isolate w-full overflow-hidden rounded-2xl border border-white/8 bg-black shadow-[0_24px_60px_-30px] shadow-black/90"
    >
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          playsInline
          className="absolute inset-0 h-full w-full bg-black object-contain"
          onClick={togglePlay}
        />

        {!channel && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-ink-850 to-ink-950 px-6 text-center">
            <div className="max-w-xs">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-500">
                <SignalOffIcon className="h-7 w-7" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-200">
                Belum ada channel dipilih
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Pilih channel dari daftar untuk mulai menonton siaran live.
              </p>
            </div>
          </div>
        )}

        {channel && status === 'loading' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[1px]">
            <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-medium text-slate-200 backdrop-blur">
              <SpinnerIcon className="h-4 w-4 animate-spin text-accent-400" />
              Menghubungkan ke stream…
            </div>
          </div>
        )}

        {channel && status === 'error' && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/85 px-4 backdrop-blur-sm sm:px-6">
            <div className="w-full max-w-sm text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-400 sm:h-14 sm:w-14">
                <SignalOffIcon className="h-5.5 w-5.5 sm:h-7 sm:w-7" />
              </span>
              <p className="mt-3 text-[13px] font-semibold text-white sm:mt-4 sm:text-sm">
                Stream tidak tersedia
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400 sm:mt-1.5 sm:text-xs">
                {error ?? 'Saluran ini tidak dapat diputar saat ini.'}
              </p>
              <div className="mt-3.5 flex items-center justify-center gap-2 sm:mt-5">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-400 px-3 py-1.5 text-[11px] font-semibold text-ink-950 transition-colors hover:bg-accent-300 sm:px-3.5 sm:py-2 sm:text-xs"
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                  Coba lagi
                </button>
                {canNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition-colors hover:bg-white/10 sm:px-3.5 sm:py-2 sm:text-xs"
                  >
                    Channel berikutnya
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {channel && status === 'paused' && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Putar channel"
            className="absolute inset-0 grid place-items-center"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-xl backdrop-blur transition-transform hover:scale-105">
              <PlayIcon className="ml-0.5 h-6 w-6" />
            </span>
          </button>
        )}

        {channel && (
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/30 to-transparent p-3.5 transition-opacity duration-300 sm:p-4 ${
              controlsShown ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {status === 'playing' && (
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-rose-300 uppercase ring-1 ring-rose-400/30 ring-inset">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Live
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white drop-shadow sm:text-base">
                  {channel.name}
                </h2>
                {meta && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-300/80">
                    {meta}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {channel && status !== 'error' && (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2.5 pt-10 pb-2.5 transition-opacity duration-300 sm:px-3.5 sm:pb-3 ${
              controlsShown
                ? 'opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onPrev}
                disabled={!canPrev}
                aria-label="Channel sebelumnya"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-200 transition-colors hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <PrevIcon className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={
                  status === 'playing' ? 'Jeda' : 'Putar'
                }
                className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink-950 transition-transform hover:scale-105"
              >
                {status === 'playing' ? (
                  <PauseIcon className="h-4.5 w-4.5" />
                ) : (
                  <PlayIcon className="ml-0.5 h-4.5 w-4.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                aria-label="Channel berikutnya"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-200 transition-colors hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <NextIcon className="h-4.5 w-4.5" />
              </button>

              <div className="group/volume ml-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? 'Nyalakan suara' : 'Bisukan suara'}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-200 transition-colors hover:bg-white/12 hover:text-white"
                >
                  {muted || volume === 0 ? (
                    <MuteIcon className="h-4.5 w-4.5" />
                  ) : (
                    <VolumeIcon className="h-4.5 w-4.5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(event) =>
                    handleVolumeChange(Number(event.target.value))
                  }
                  aria-label="Volume"
                  className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/25 accent-accent-400 sm:w-20 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRetry}
                  aria-label="Muat ulang stream"
                  title="Muat ulang stream"
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-200 transition-colors hover:bg-white/12 hover:text-white"
                >
                  <RefreshIcon className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={
                    isFullscreen ? 'Keluar dari layar penuh' : 'Layar penuh'
                  }
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-200 transition-colors hover:bg-white/12 hover:text-white"
                >
                  <FullscreenIcon className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
