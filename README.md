# OpenTV Web

Web IPTV player ringan berbasis React + Vite + TypeScript, memakai playlist publik
[iptv-org](https://github.com/iptv-org/iptv) sebagai sumber channel.

## Fitur

- Daftar channel dari playlist M3U global (`index.m3u`) dengan parsing toleran.
- Pencarian channel, filter kategori (`group-title`), dan filter negara.
- Favorit tersimpan di `localStorage` (tanpa login).
- Pemutar HLS via `hls.js` (dimuat lazy) + fallback HTML5 video native.
- Kontrol play/pause, volume/mute, channel sebelumnya/berikutnya, fullscreen, retry.
- Status loading, error playlist, error stream, dan empty state yang jelas.
- Layout responsif desktop/HP/tablet, target fokus keyboard untuk perangkat TV.
- Proxy playlist serverless opsional di `api/playlist.ts` (dipakai otomatis sebagai
  fallback bila fetch langsung gagal).

## Menjalankan

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
npm run preview
```

## Deploy ke Vercel

1. Push folder ini ke repository Git.
2. Impor repository di Vercel. Framework Vite terdeteksi otomatis
   (`npm run build`, output `dist`).
3. Deploy. Tidak ada environment variable/rahasia yang diperlukan.

`api/playlist.ts` adalah Vercel Serverless Function yang hanya meneruskan playlist
dari satu URL sumber tetap (bukan proxy terbuka), dengan timeout dan batas ukuran.

## Struktur

```text
src/
├── components/   # UI: header, filter, daftar, kartu, pemutar
├── hooks/        # usePlaylist, useFavorites
├── lib/          # m3uParser, config, helper pemutar
├── types/        # tipe Channel
├── App.tsx
├── main.tsx
└── index.css
api/playlist.ts   # proxy playlist opsional (Vercel)
```

## Catatan

- Ketersediaan stream dan hak siar sepenuhnya bergantung pada masing-masing
  penyedia. Sebagian channel bisa offline, geo-blocked, atau memakai codec yang
  tidak didukung browser.
- Playlist global berisi ribuan channel; daftar dirender bertahap (120 item per
  "muat lebih banyak") agar tetap ringan.
- URL playlist bersifat konfigurasi publik; jangan menaruh token/rahasia di
  variabel `VITE_*`.
