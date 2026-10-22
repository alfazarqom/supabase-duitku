# Model Database dan Integritas Transaksi

- Status: PROPOSED
- Skema aktual: NOT VERIFIED
- Migration: Tidak dibuat atau dijalankan sebagai bagian dari draft ini.

## 1. Tujuan

Dokumen ini menetapkan kebutuhan konseptual untuk menyimpan pesanan, rincian item, dan transaksi pembayaran secara konsisten. Dokumen ini tidak menetapkan bahwa tabel dengan nama tertentu sudah ada.

## 2. Entitas konseptual

| Entitas | Tujuan | Status |
|---|---|---|
| Products | Data produk dan harga tepercaya | Nama dan kolom aktual belum diverifikasi |
| Orders | Data utama pesanan dan total yang disetujui | Belum diverifikasi |
| Order items | Snapshot item, kuantitas, dan harga pesanan | Belum diverifikasi |
| Payments | Referensi provider, nominal, dan status pembayaran | Belum diverifikasi |
| Profiles | Profil pengguna jika diperlukan | Belum diverifikasi |
| Inventory/reservations | Stok atau reservasi bila model bisnis menggunakannya | Belum diverifikasi |

Jangan membuat tabel baru sebelum tabel, view, RPC, dan struktur terkait yang sudah ada diaudit.

## 3. Prinsip integritas

### Nominal

- Gunakan satuan IDR yang konsisten.
- Hindari perhitungan mata uang menggunakan floating point.
- Validasi nominal final terhadap item, diskon, ongkir, dan total yang disetujui.
- Nominal yang dikirim browser bukan sumber kebenaran.

### Referensi transaksi

- Merchant order reference harus dapat dikaitkan dengan pesanan yang benar.
- Referensi provider harus disimpan sesuai kebutuhan rekonsiliasi.
- Constraint unik harus dirancang berdasarkan semantik transaksi yang sebenarnya.
- Jangan menggunakan referensi acak sebagai solusi konflik sebelum penyebabnya dipahami.

### Snapshot item

Rincian pesanan perlu mempertahankan informasi yang diperlukan untuk menjelaskan harga saat checkout, walaupun data produk berubah kemudian. Struktur snapshot harus ditentukan setelah model produk aktual diperiksa.

### Status

Status pesanan dan pembayaran merupakan konsep terpisah. Status pengiriman juga perlu dipisahkan jika sistem mengelolanya.

Kategori konseptual:
- Order: menunggu tindakan, menunggu pembayaran, diproses, selesai, dibatalkan.
- Payment: menunggu, berhasil, gagal, kedaluwarsa, refund jika didukung proses nyata.
- Shipment: belum dikirim, dikirim, terkirim, gagal.

Nilai final harus cocok dengan enum, constraint, dan kontrak frontend aktual. Daftar ini bukan migration atau enum yang telah disetujui.

## 4. Transisi status

Setiap perubahan status harus memiliki status sebelumnya, status tujuan, aktor atau sumber event, syarat validasi, efek samping yang diperbolehkan, aturan penanganan duplikat, dan bukti audit yang sesuai.

Callback tidak boleh memindahkan transaksi ke status yang tidak sah. Status terminal tidak boleh kembali ke status sebelumnya tanpa aturan bisnis dan provider yang jelas.

## 5. Transaksi atomik dan idempotensi

Operasi pembayaran harus mencegah:
- Callback ganda memproses pembayaran lebih dari sekali.
- Stok dikurangi dua kali.
- Reservasi dilepas dua kali.
- Status pembayaran berubah tanpa perubahan pesanan yang semestinya.
- Dua checkout bersamaan melewati batas stok.

Gunakan constraint dan operasi database atomik sesuai model yang telah diaudit. Jika transaksi database tidak dapat mencakup seluruh efek samping, desain harus memiliki mekanisme retry dan rekonsiliasi yang dapat diamati.

## 6. RLS dan grants

Untuk setiap tabel yang dapat diakses melalui API:
- Tentukan apakah RLS wajib diaktifkan.
- Dokumentasikan peran yang boleh membaca dan menulis.
- Batasi pengguna pada data yang berhak mereka akses.
- Larang pengguna biasa mengubah status pembayaran secara langsung.
- Audit grant `PUBLIC`, `anon`, dan `authenticated`.
- Periksa hak eksekusi RPC dan penggunaan `SECURITY DEFINER`.

Edge Function yang menggunakan hak istimewa tetap harus menerapkan otorisasi secara eksplisit. Jangan mengandalkan RLS jika jalur eksekusi memang melewatinya.

## 7. Audit database yang harus dilakukan

1. Inventarisasi tabel, view, enum, dan kolom aktual.
2. Periksa primary key, foreign key, unique constraint, dan indeks.
3. Periksa migration dan perbedaan antara migration dengan skema aktif.
4. Inventarisasi trigger dan RPC yang mengubah status atau stok.
5. Periksa RLS, policies, grants, dan hak eksekusi fungsi.
6. Petakan seluruh Edge Function yang membaca atau menulis objek terkait.
7. Petakan pemanggil frontend dan proses administratif.
8. Tentukan sumber kebenaran stok serta waktu perubahan stok.
9. Identifikasi jalur callback, status-check, expiry, pembatalan, dan refund.

## 8. Larangan sebelum persetujuan

Dokumen ini tidak mengizinkan pembuatan atau penghapusan tabel, perubahan kolom/constraint/indeks/enum/trigger/RPC/RLS, perubahan data pesanan atau stok, atau eksekusi migration terhadap database mana pun.

## 9. Kriteria penerimaan

- Skema aktual dan riwayat migration telah dibandingkan.
- Semua perubahan status kritis memiliki aturan eksplisit.
- Constraint mencegah duplikasi yang relevan.
- RLS dan grants diuji untuk setiap peran yang relevan.
- Efek callback terhadap pesanan dan stok idempoten.
- Semua temuan memiliki bukti, tingkat risiko, dan rekomendasi.
