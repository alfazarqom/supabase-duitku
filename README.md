# Asri Collection — Supabase Duitku Backend

Backend e-commerce berbasis Supabase yang dirancang untuk mendukung pengelolaan pesanan dan integrasi pembayaran Duitku POP melalui Supabase Edge Functions.

> **Status dokumentasi:** Draft V1 untuk ditinjau.
>
> **Status implementasi:** Belum diverifikasi secara menyeluruh.
>
> **Environment pembayaran target:** Duitku Sandbox untuk pengembangan dan pengujian. Integrasi Sandbox belum boleh dianggap berhasil tanpa bukti tes.

## Daftar Isi

- [Tujuan dan Ruang Lingkup](#tujuan-dan-ruang-lingkup)
- [Status Implementasi](#status-implementasi)
- [Arsitektur](#arsitektur)
- [Prasyarat](#prasyarat)
- [Menyiapkan Lingkungan Lokal](#menyiapkan-lingkungan-lokal)
- [Konfigurasi](#konfigurasi)
- [Alur Pembayaran](#alur-pembayaran)
- [Keamanan](#keamanan)
- [Pengujian](#pengujian)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Dokumentasi](#dokumentasi)
- [Batasan dan Pekerjaan Berikutnya](#batasan-dan-pekerjaan-berikutnya)

## Tujuan dan Ruang Lingkup

Repository ini ditujukan untuk menjadi backend bagi aplikasi e-commerce Asri Collection, dengan tanggung jawab utama:

- Memvalidasi permintaan checkout di sisi server.
- Menggunakan data produk dan harga tepercaya dari database.
- Mengelola referensi pesanan dan transaksi pembayaran.
- Membuat invoice melalui Duitku POP.
- Menerima dan memverifikasi notifikasi pembayaran.
- Menjaga konsistensi status pesanan dan pembayaran.
- Menyediakan kontrak API untuk frontend yang dikelola terpisah.

Teknologi yang direncanakan meliputi Supabase PostgreSQL, Supabase Edge Functions, TypeScript/Deno, Duitku POP, dan Supabase CLI. Daftar ini merupakan rancangan target, bukan bukti bahwa seluruh komponen telah dikonfigurasi dan diuji.

## Status Implementasi

Gunakan status secara konsisten:

| Status | Arti |
|---|---|
| PROPOSED | Baru berupa rancangan atau requirement. |
| IMPLEMENTED | Kode atau konfigurasi tersedia dan dapat diperiksa. |
| VERIFIED | Pengujian relevan dijalankan dan buktinya dicatat. |
| NOT VERIFIED | Bukti yang cukup belum tersedia. |
| NOT APPLICABLE | Tidak termasuk ruang lingkup implementasi. |

Status awal berdasarkan pemeriksaan dokumentasi:

| Komponen | Status |
|---|---|
| README.md | Tersedia; status implementasi tetap perlu diverifikasi |
| Dokumentasi teknis terpisah | Tersedia di `docs/` sebagai Draft V1; kesesuaian dengan implementasi belum diverifikasi |
| Struktur aktual Edge Functions | Belum diverifikasi |
| Migration dan skema database | Belum diverifikasi |
| Kebijakan RLS dan grants | Belum diverifikasi |
| Konfigurasi secrets | Belum diverifikasi |
| Integrasi Duitku Sandbox end-to-end | Belum diverifikasi |
| Kesiapan Production | Belum diverifikasi |

Status harus diperbarui setelah source code, konfigurasi, database, dan hasil tes diperiksa.

## Arsitektur

Arsitektur target terdiri dari:

1. Frontend mengirim permintaan checkout ke backend.
2. Edge Function memvalidasi request dan mengambil data produk dari sumber tepercaya.
3. Backend menghitung total pesanan dan mengelola state transaksi.
4. Backend membuat invoice menggunakan kredensial server Duitku.
5. Frontend melanjutkan pembayaran melalui URL dari provider sesuai mode integrasi yang dipilih.
6. Duitku mengirim HTTP callback ke backend.
7. Backend memverifikasi signature, referensi pesanan, nominal, dan transisi status.
8. Database diperbarui secara konsisten dan idempoten.

Frontend tidak boleh menjadi sumber kebenaran harga, hasil pembayaran, atau perubahan status transaksi. Lihat [docs/architecture.md](docs/architecture.md).

## Prasyarat

- Git.
- Supabase CLI.
- Docker dan dependensi lokal yang diperlukan apabila menjalankan stack lokal.
- Proyek Supabase untuk pengembangan atau staging.
- Akun merchant Duitku dengan akses Sandbox.
- Toolchain yang sesuai dengan konfigurasi aktual Edge Functions.
- Repository frontend yang akan menggunakan kontrak API backend.

Versi minimum tool harus ditetapkan setelah konfigurasi proyek aktual diperiksa.

## Menyiapkan Lingkungan Lokal

Clone repository:

~~~bash
git clone https://github.com/alfazarqom/supabase-duitku.git
cd supabase-duitku
~~~

Periksa status lokal:

~~~bash
git status --short
git branch --show-current
git log -1 --oneline
~~~

Jika konfigurasi proyek Supabase lokal sudah tersedia dan ditinjau:

~~~bash
supabase start
~~~

Perintah untuk menjalankan Edge Functions harus disesuaikan dengan nama direktori fungsi yang benar-benar tersedia. Jangan menjalankan migration pada database aktif hanya dengan mengikuti contoh dokumentasi.

## Konfigurasi

Kategori konfigurasi yang mungkin diperlukan:

| Kategori | Ketentuan |
|---|---|
| Merchant code | Identitas merchant sesuai environment |
| Merchant API key | Hanya digunakan di backend |
| Environment | Pemilihan Sandbox atau Production secara eksplisit |
| Callback URL | URL publik endpoint callback |
| Return URL | URL frontend untuk navigasi setelah pembayaran |
| Supabase URL dan key | Sesuai runtime dan kebijakan akses |

Nama variabel final wajib dicocokkan dengan source code. Gunakan Supabase Secrets untuk konfigurasi server jarak jauh. Jangan memasukkan kredensial asli ke repository, frontend, dokumentasi, log, atau issue publik.

Lihat [docs/deployment.md](docs/deployment.md).

## Alur Pembayaran

1. Frontend mengirim permintaan checkout.
2. Backend memvalidasi item, kuantitas, ketersediaan, dan otorisasi.
3. Backend mengambil harga dari database.
4. Backend menyimpan atau mengidentifikasi pesanan sesuai kontrak yang disetujui.
5. Backend menghitung total dan membuat invoice melalui Duitku.
6. Backend menyimpan referensi transaksi dan hasil pembuatan invoice.
7. Frontend menerima informasi yang diperlukan untuk melanjutkan pembayaran.
8. Duitku mengirim callback ke backend.
9. Backend memvalidasi signature dan mencocokkan transaksi.
10. Backend memperbarui status secara aman.
11. Frontend membaca status otoritatif dari backend.

Redirect atau JavaScript callback di browser bukan bukti pembayaran berhasil. Lihat [docs/duitku-integration.md](docs/duitku-integration.md).

## Keamanan

- Kredensial Duitku tidak pernah dikirim ke frontend.
- Harga dan nominal final dihitung atau diverifikasi di backend.
- Callback diverifikasi menggunakan kontrak signature resmi yang berlaku.
- Secret yang tidak tersedia menyebabkan verifikasi gagal secara aman.
- Akses tabel dibatasi melalui RLS dan grants yang sesuai.
- Status pembayaran hanya diperbarui melalui jalur tepercaya.
- Callback duplikat dan request bersamaan tidak menerapkan perubahan dua kali.
- Log dan respons error tidak membocorkan secrets atau data pribadi yang tidak diperlukan.

Lihat [docs/security.md](docs/security.md).

## Pengujian

Rencana pengujian mencakup validasi checkout, signature invoice, callback valid/tidak valid, nominal dan referensi yang tidak cocok, callback duplikat, kegagalan provider/database, otorisasi, konfigurasi environment, dan rekonsiliasi.

Hasil tes hanya boleh ditandai VERIFIED apabila benar-benar dijalankan dan buktinya tersedia. Lihat [docs/testing.md](docs/testing.md).

## Deployment

Deployment bukan bagian otomatis dari pengembangan. Sebelum deployment diperlukan target dan tindakan yang disetujui, pemeriksaan migration, konfigurasi secrets yang benar, verifikasi callback, tes Sandbox, dan rencana pemulihan.

Lihat [docs/deployment.md](docs/deployment.md).

## Troubleshooting

| Gejala | Pemeriksaan awal |
|---|---|
| Invoice gagal dibuat | Environment, payload, signature, dan respons provider |
| Callback ditolak | Content type, field wajib, signature, nominal, dan referensi transaksi |
| Status tidak berubah | Hasil verifikasi, aturan transisi, dan error database |
| Status berubah dua kali | Idempotensi, constraint, dan operasi database atomik |
| Akses ditolak | JWT, otorisasi, grants, dan RLS |
| Secret tidak terbaca | Nama variabel dan konfigurasi environment; jangan cetak nilainya |

Jangan menonaktifkan validasi signature atau memperluas hak akses sebagai workaround.

## Dokumentasi Resmi Duitku

Gunakan dokumentasi resmi berikut sebagai sumber rujukan untuk implementasi. Pastikan bagian dan kontrak yang relevan diperiksa ulang sebelum mengubah kode; jangan menebak parameter, signature, endpoint, atau format callback.

- [Duitku POP — dokumentasi utama](https://docs.duitku.com/pop/id/)
- [Duitku API — dokumentasi API](https://docs.duitku.com/api/id/)
- [Metode pembayaran Duitku POP](https://docs.duitku.com/pop/id/#payment-method)
- [FAQ resmi Duitku](https://www.duitku.com/frequently-asked-questions/)
- [Demo Duitku Sandbox](https://api-sandbox.duitku.com/demoduitku/)
- [Halaman demo pembayaran Sandbox](https://sandbox.duitku.com/payment/demopage.aspx)
- [Situs resmi Duitku](https://www.duitku.com/)

Dokumentasi dan halaman demo adalah referensi; keberhasilan integrasi tetap harus dibuktikan dengan pemeriksaan kode dan pengujian Sandbox.

## Dokumentasi

- [Arsitektur](docs/architecture.md)
- [Kontrak API](docs/api-contract.md)
- [Skema database](docs/database-schema.md)
- [Integrasi Duitku POP](docs/duitku-integration.md)
- [Keamanan](docs/security.md)
- [Pengujian](docs/testing.md)
- [Deployment](docs/deployment.md)

Dokumen tersebut adalah baseline rancangan dan tidak boleh dianggap bukti fitur telah tersedia.

## Batasan dan Pekerjaan Berikutnya

1. Inventarisasi file, Edge Functions, migration, dan konfigurasi aktual.
2. Cocokkan nama endpoint dan variabel konfigurasi dengan source code.
3. Audit skema, constraint, RLS, grants, dan operasi database.
4. Verifikasi request signature dan callback terhadap dokumentasi Duitku terkini.
5. Jalankan tes otomatis dan Sandbox yang relevan.
6. Dokumentasikan bukti pengujian dan risiko tersisa.

## Lisensi

Lisensi belum ditetapkan oleh draft ini. Tentukan lisensi repository sebelum menyatakan ketentuan distribusi atau penggunaan ulang kode.

---

Dokumentasi ini tidak membuktikan suatu fitur telah diimplementasikan. Gunakan source code, konfigurasi aktual, dan bukti pengujian sebagai dasar penetapan status.
