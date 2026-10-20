# Konsep Aplikasi Web IPTV

> Dokumen konsep awal untuk aplikasi TV berbasis web yang menggunakan
> playlist publik dari IPTV-org. Dokumen ini menjadi acuan sebelum
> implementasi; proses hosting/deploy ke Vercel akan dilakukan sendiri
> oleh pemilik proyek.

## 1. Ringkasan Proyek

**Nama sementara:** OpenTV Web\
**Jenis aplikasi:** Web IPTV / Live TV Player\
**Sumber playlist:** https://iptv-org.github.io/iptv/index.m3u\
**Target hosting:** Vercel\
**Target perangkat:** Browser desktop, HP, tablet, dan Android TV yang
kompatibel\
**Model aplikasi:** Frontend web dengan opsi Vercel Serverless Function
sebagai perantara playlist jika dibutuhkan.

Aplikasi menampilkan daftar saluran TV dari playlist M3U, memungkinkan
pengguna mencari dan memfilter saluran, lalu memutar URL streaming yang
tersedia dan kompatibel dengan browser. Playlist adalah sumber metadata
dan URL stream, bukan jaminan bahwa semua saluran aktif atau dapat
diputar.

## 2. Tujuan

-   Membuat pengalaman menonton live TV yang sederhana dan nyaman
    melalui browser.
-   Mengambil daftar saluran dari playlist IPTV-org tanpa mengelola
    database channel sendiri.
-   Menyediakan pencarian, kategori, pilihan negara, favorit, dan
    pemutar video.
-   Menjaga aplikasi tetap ringan, responsif, dan mudah di-deploy ke
    Vercel.
-   Mengutamakan saluran publik dan menghormati hak siar serta ketentuan
    masing-masing sumber.

## 3. Ruang Lingkup MVP

### Fitur utama

1.  **Halaman Live TV**
    -   Area video player.
    -   Nama dan logo channel yang sedang dipilih.
    -   Status loading, error, dan stream tidak tersedia.
    -   Kontrol play/pause, volume, fullscreen, dan pemilihan channel
        berikutnya/sebelumnya jika didukung.
2.  **Daftar channel**
    -   Menampilkan nama dan logo jika tersedia.
    -   Pencarian berdasarkan nama channel.
    -   Filter kategori berdasarkan `group-title`.
    -   Filter negara berdasarkan metadata playlist jika tersedia.
    -   Penanda channel yang sedang diputar.
3.  **Favorit**
    -   Pengguna dapat menambah atau menghapus channel favorit.
    -   Favorit disimpan di `localStorage` pada perangkat/browser
        pengguna.
    -   Tidak perlu login untuk MVP.
4.  **Responsif dan navigasi**
    -   Desktop: layout dengan player dan panel daftar channel.
    -   HP/tablet: layout yang menyesuaikan lebar layar.
    -   Android TV: tombol dan fokus keyboard/remote diupayakan;
        kompatibilitas remote bergantung pada browser/perangkat.
5.  **Penanganan error**
    -   Pesan jika playlist gagal dimuat.
    -   Pesan jika URL stream tidak dapat diputar.
    -   Tombol untuk mencoba kembali.
    -   Tidak menganggap seluruh stream akan selalu tersedia.

### Di luar ruang lingkup MVP

-   Akun pengguna dan sinkronisasi favorit lintas perangkat.
-   Langganan, pembayaran, atau paywall.
-   Database dan panel admin channel.
-   Rekaman siaran (DVR), jadwal program/EPG, dan catch-up TV.
-   Aplikasi native Android/iOS.
-   Mengakali DRM, autentikasi, geo-blocking, atau pembatasan penyedia.

## 4. Teknologi yang Disarankan

  -----------------------------------------------------------------------
  Bagian                  Teknologi               Kegunaan
  ----------------------- ----------------------- -----------------------
  Framework               React + Vite            UI web cepat dan
                                                  sederhana

  Bahasa                  TypeScript              Tipe data untuk channel
                                                  dan playlist

  Styling                 Tailwind CSS            Desain responsif

  Routing                 React Router (opsional) Jika nanti ada halaman
                                                  terpisah

  Pemutar HLS             `hls.js`                Memutar stream HLS pada
                                                  browser yang mendukung
                                                  Media Source Extensions

  Format video native     HTML5 `<video>`         Memutar format yang
                                                  didukung langsung oleh
                                                  browser

  Parsing playlist        Parser M3U buatan       Membaca metadata dan
                          aplikasi atau library   URL stream
                          teruji                  

  Penyimpanan favorit     `localStorage`          Menyimpan favorit tanpa
                                                  backend

  Hosting                 Vercel                  Hosting frontend dan
                                                  fungsi serverless
                                                  opsional
  -----------------------------------------------------------------------

**Catatan format:** tidak semua URL dalam playlist adalah HLS `.m3u8`.
Browser memiliki dukungan format yang berbeda-beda; stream tertentu
mungkin tidak bisa diputar tanpa dukungan codec atau teknologi tambahan.
Jangan menjanjikan semua channel kompatibel.

## 5. Sumber Data dan Parsing M3U

URL playlist utama:

`https://iptv-org.github.io/iptv/index.m3u`

Parser perlu mengenali baris metadata `#EXTINF` dan URL stream yang
mengikutinya. Field yang dapat dimanfaatkan jika tersedia:

-   `tvg-id`: identitas channel.
-   `tvg-name`: nama channel.
-   `tvg-logo`: URL logo.
-   `group-title`: kategori/grup channel.
-   `tvg-country` atau metadata negara lain: negara asal, jika
    tercantum.
-   Teks judul setelah metadata: fallback nama channel.
-   Baris URL setelah metadata: alamat stream.

### Aturan parsing

-   Abaikan baris kosong dan komentar yang tidak relevan.
-   Tangani atribut yang tidak tersedia.
-   Gunakan nama fallback bila `tvg-name` kosong.
-   Hindari duplikasi berdasarkan kombinasi ID/nama dan URL stream.
-   Jangan mengasumsikan struktur playlist selalu sempurna.
-   Sediakan status loading, error, dan daftar kosong.

### Memilih channel Indonesia atau global

Untuk MVP, data dapat dimuat dari playlist global lalu difilter
berdasarkan metadata negara. Hasil filter Indonesia hanya seakurat
metadata sumber. Bila nantinya diperlukan daftar yang lebih kecil,
playlist negara yang disediakan oleh proyek IPTV-org dapat
dipertimbangkan, setelah URL dan ketersediaannya diverifikasi.

## 6. Arsitektur Aplikasi

### Alur data

1.  Aplikasi meminta playlist.
2.  Playlist di-parse menjadi objek channel.
3.  Pengguna mencari atau memfilter channel.
4.  Pengguna memilih channel.
5.  URL stream diberikan ke pemutar video.
6.  Favorit disimpan secara lokal di browser.

### Pilihan pengambilan playlist

**Opsi A --- fetch langsung dari browser** - Lebih sederhana dan tidak
memerlukan fungsi backend. - Bergantung pada kebijakan CORS dan
ketersediaan URL sumber. - Tidak bisa menerapkan caching server-side.

**Opsi B --- Vercel Serverless Function sebagai proxy/caching tipis** -
Frontend meminta endpoint milik aplikasi, misalnya `/api/playlist`. -
Function mengambil playlist dari sumber, memberi cache header yang
sesuai, lalu meneruskannya ke frontend. - Berguna jika fetch langsung
terkena masalah CORS atau untuk mengurangi permintaan berulang. - Ini
bukan database dan tidak menyimpan saluran secara permanen. - Function
harus membatasi tujuan fetch ke sumber yang sudah ditentukan, menetapkan
timeout dan ukuran respons yang wajar, serta tidak menjadi proxy terbuka
untuk URL sembarang.

**Rekomendasi implementasi:** mulai dengan fetch langsung. Jika CORS,
performa, atau kebutuhan cache menjadi kendala, tambahkan function proxy
khusus playlist. Periksa batas runtime dan ukuran respons Vercel saat
implementasi.

## 7. Konsep UI/UX

### Arah visual

-   Tema gelap modern dengan kontras yang jelas.
-   Latar belakang charcoal/navy gelap.
-   Aksen warna secukupnya untuk channel aktif dan tombol utama.
-   Minimalkan bayangan dan dekorasi berlebihan.
-   Logo channel tetap terlihat jelas, dengan fallback bila logo gagal
    dimuat.

### Susunan halaman

1.  **Header**
    -   Nama/logo aplikasi.
    -   Pencarian channel.
    -   Tombol tema atau pengaturan sederhana bila diperlukan.
2.  **Navigasi/filter**
    -   Semua channel.
    -   Favorit.
    -   Kategori.
    -   Negara.
3.  **Area player**
    -   Video player utama.
    -   Nama channel dan status stream.
    -   Kontrol player.
4.  **Panel channel**
    -   Daftar atau grid channel.
    -   Logo dan nama channel.
    -   Indikator channel aktif.
5.  **Footer**
    -   Informasi bahwa sumber channel berasal dari playlist publik
        pihak ketiga.
    -   Catatan bahwa ketersediaan dan hak siar bergantung pada
        masing-masing penyedia.

## 8. Struktur Folder Awal

Contoh struktur yang dapat digunakan:

``` text
opentv-web/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AppHeader.tsx
│   │   ├── ChannelCard.tsx
│   │   ├── ChannelList.tsx
│   │   ├── ChannelFilters.tsx
│   │   ├── SearchInput.tsx
│   │   └── VideoPlayer.tsx
│   ├── hooks/
│   │   ├── usePlaylist.ts
│   │   └── useFavorites.ts
│   ├── lib/
│   │   ├── m3uParser.ts
│   │   └── player.ts
│   ├── types/
│   │   └── channel.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── api/
│   └── playlist.ts        # opsional, hanya jika proxy diperlukan
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── concept.md
```

Struktur ini adalah rancangan awal; detailnya boleh disesuaikan saat
implementasi.

## 9. Rancangan Tipe Data Channel

``` ts
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
```

`isFavorite` sebaiknya diturunkan dari daftar ID favorit saat aplikasi
berjalan, bukan ditulis permanen ke data playlist.

## 10. Rencana Implementasi

### Tahap 1 --- Fondasi

-   Buat proyek React + Vite + TypeScript.
-   Pasang Tailwind CSS.
-   Siapkan tipe data dan parser M3U.
-   Uji parsing dengan sampel playlist.

### Tahap 2 --- Fitur channel

-   Muat playlist dan tampilkan daftar channel.
-   Tambahkan pencarian, filter kategori, dan filter negara.
-   Tambahkan status loading, error, dan empty state.

### Tahap 3 --- Pemutar video

-   Integrasikan HTML5 video dan `hls.js`.
-   Deteksi jenis stream secara wajar.
-   Tambahkan kontrol dasar, fullscreen, serta pesan error dan tombol
    retry.
-   Uji beberapa URL yang memang dapat diakses secara publik.

### Tahap 4 --- Favorit dan UI

-   Tambahkan favorit berbasis `localStorage`.
-   Rapikan desain dark mode dan responsivitas.
-   Tambahkan navigasi keyboard/fokus untuk perangkat TV sejauh
    didukung.

### Tahap 5 --- Pengujian dan kesiapan hosting

-   Jalankan build produksi lokal.
-   Pastikan tidak ada error TypeScript/build.
-   Uji tampilan pada desktop dan HP.
-   Uji fetch playlist, CORS, logo, dan stream gagal.
-   Siapkan konfigurasi Vercel dan dokumentasi deploy; pemilik proyek
    melakukan deploy sendiri.

## 11. Kriteria Selesai MVP

-   [ ] Proyek dapat di-install dan dijalankan secara lokal.
-   [ ] Playlist M3U berhasil diambil dan di-parse.
-   [ ] Daftar channel, pencarian, kategori, dan filter negara
    berfungsi.
-   [ ] Channel yang kompatibel dapat diputar.
-   [ ] Favorit tetap tersimpan setelah halaman dimuat ulang pada
    browser yang sama.
-   [ ] Error playlist dan stream ditampilkan dengan jelas.
-   [ ] Layout dapat digunakan di desktop dan HP.
-   [ ] `npm run build` berhasil.
-   [ ] Tidak ada API key atau rahasia yang ditaruh di frontend.
-   [ ] Proyek siap dihubungkan ke Vercel oleh pemilik proyek.

## 12. Hosting di Vercel

Hosting belum dilakukan pada tahap konsep ini. Saat implementasi siap,
alur umumnya:

1.  Simpan proyek ke repository Git.
2.  Buka Vercel dan impor repository.
3.  Untuk proyek Vite, gunakan build command `npm run build` dan output
    directory `dist`.
4.  Jika memakai Vercel Serverless Function, pastikan endpoint `api/`
    sesuai dengan runtime dan konfigurasi yang didukung.
5.  Deploy, lalu uji playlist dan pemutar dari URL production.
6.  Jika memakai domain sendiri, atur domain setelah deployment
    berhasil.

Tidak diperlukan environment variable untuk playlist publik jika URL
sumber ditulis sebagai konfigurasi publik. Jangan menaruh token atau
rahasia apa pun di variabel `VITE_*`, karena nilainya dapat masuk ke
bundle frontend.

## 13. Risiko dan Batasan

-   **Stream mati atau berubah:** URL pihak ketiga bisa tidak tersedia
    kapan saja.
-   **CORS:** browser dapat menolak permintaan lintas origin; gunakan
    proxy terbatas hanya bila diperlukan.
-   **Codec/format:** tidak semua format stream didukung browser.
-   **Geo-blocking dan autentikasi:** beberapa penyedia membatasi akses.
-   **Logo eksternal:** gambar dapat gagal dimuat atau lambat.
-   **Hak siar:** keberadaan URL dalam playlist tidak otomatis
    membuktikan bahwa redistribusi atau penggunaan ulang konten
    diizinkan.
-   **Performa:** playlist global besar dapat membutuhkan waktu parsing
    dan rendering; pertimbangkan lazy rendering atau virtualisasi daftar
    jika diperlukan.
-   **Android TV:** pengalaman remote berbeda-beda antar browser; perlu
    diuji pada perangkat sasaran.

## 14. Keputusan yang Ditunda

-   Nama dan branding final.
-   Apakah MVP menampilkan semua negara atau hanya Indonesia.
-   Apakah proxy serverless diperlukan setelah pengujian fetch langsung.
-   Dukungan EPG/jadwal program.
-   Dukungan instalasi sebagai PWA.

------------------------------------------------------------------------

**Status:** Konsep awal --- belum ada implementasi atau deployment.\
**Prinsip utama:** mulai sederhana, tidak memakai database/login untuk
MVP, gunakan sumber playlist publik, dan pastikan aplikasi tetap memberi
tahu pengguna saat stream tidak tersedia.
