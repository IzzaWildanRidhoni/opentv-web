import { useEffect, useRef, useState } from 'react';
import { LIME_GRADIENT } from '../lib/theme';
import { TvIcon } from './icons';
import hero1 from '../assets/hero-1.jpg';
import hero2 from '../assets/hero-2.jpg';
import hero3 from '../assets/hero-3.jpg';
import hero4 from '../assets/hero-4.jpg';

type HeroSlide = {
  image: string;
  label: string;
  title: string;
  subtitle: string;
};

const SLIDES: HeroSlide[] = [
  {
    image: hero1,
    label: 'OpenTV',
    title: 'Siaran TV dunia dalam satu genggaman',
    subtitle:
      'Jelajahi channel dari berbagai negara langsung di browser — tanpa daftar, tanpa aplikasi.',
  },
  {
    image: hero2,
    label: 'Live TV',
    title: 'Zap channel seperti smart TV',
    subtitle:
      'Pemutar penuh kontrol: volume, layar penuh, dan pindah channel dengan satu tombol.',
  },
  {
    image: hero3,
    label: 'Favorit',
    title: 'Simpan channel kesayanganmu',
    subtitle:
      'Favorit dan riwayat tontonan tersimpan otomatis di perangkat ini.',
  },
  {
    image: hero4,
    label: 'Gratis',
    title: 'Tanpa langganan, mulai nonton',
    subtitle:
      'Cukup buka halaman ini, pilih channel, dan nikmati siarannya sekarang.',
  },
];

const ROTATE_MS = 6000;

type HeroCarouselProps = {
  onWatch: () => void;
  onBrowse: () => void;
};

export function HeroCarousel({ onWatch, onBrowse }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!pausedRef.current) {
        setIndex((state) => (state + 1) % SLIDES.length);
      }
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="group relative isolate aspect-[4/3] max-h-[520px] w-full overflow-hidden rounded-3xl border border-white/8 sm:aspect-[16/8.5] xl:aspect-[16/7]"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      aria-roledescription="carousel"
      aria-label="Sorotan"
    >
      {SLIDES.map((slide, slideIndex) => (
        <img
          key={slide.image}
          src={slide.image}
          alt=""
          fetchPriority={slideIndex === 0 ? 'high' : 'low'}
          aria-hidden={slideIndex !== index}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            slideIndex === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Overlay gradient + tint agar teks terbaca */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-ink-950/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_120%,rgba(11,13,19,0.55),transparent_70%)]"
      />

      {/* Konten slide */}
      <div
        key={index}
        className="fade-in absolute inset-x-0 bottom-0 flex flex-col items-start gap-2.5 p-4 sm:p-8 sm:pb-10"
      >
        <span className="inline-flex items-center rounded-full bg-ink-950/60 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-accent-400 uppercase backdrop-blur-md ring-1 ring-white/10 ring-inset">
          {SLIDES[index].label}
        </span>
        <h2 className="font-display max-w-xl text-balance text-2xl leading-tight font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl xl:text-[2.75rem]">
          {SLIDES[index].title}
        </h2>
        <p className="max-w-md text-xs leading-relaxed text-white/70 sm:text-sm">
          {SLIDES[index].subtitle}
        </p>

        <div className="mt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onWatch}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold transition-transform hover:scale-[1.03] active:scale-95 sm:text-sm ${LIME_GRADIENT}`}
          >
            <TvIcon className="h-4 w-4" />
            Tonton Live TV
          </button>
          <button
            type="button"
            onClick={onBrowse}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:text-sm"
          >
            Jelajahi channel
          </button>
        </div>
      </div>

      {/* Indikator */}
      <div className="absolute top-4 right-4 hidden items-center gap-1.5 sm:flex">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setIndex(slideIndex)}
            aria-label={`Ke slide ${slideIndex + 1}`}
            aria-current={slideIndex === index ? 'true' : undefined}
            title={`${slideIndex + 1} · ${slide.label}`}
            className={`h-1.5 rounded-full transition-all ${
              slideIndex === index
                ? 'w-6 bg-accent-400 shadow-[0_0_10px_rgba(149,255,80,0.5)]'
                : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
