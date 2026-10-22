# Arsitektur Backend Supabase × Duitku POP

- Status: PROPOSED
- Cakupan: Backend Supabase dan Duitku POP
- Environment target awal: lokal dan Sandbox
- Implementasi aktual: NOT VERIFIED

## 1. Tujuan

Dokumen ini menjelaskan batas tanggung jawab komponen backend, alur data, dan aturan konsistensi pembayaran. Diagram dan alur merupakan target desain sampai dikonfirmasi terhadap kode aktual.

## 2. Komponen

### Frontend

Frontend mengumpulkan input checkout dan menampilkan informasi transaksi. Frontend tidak berwenang menetapkan harga final yang dipercaya backend, status pembayaran sebagai berhasil, perubahan status transaksi provider, atau menyimpan kredensial server.

### Supabase Edge Functions

Edge Functions menjadi batas API untuk operasi server-side seperti validasi checkout, pembuatan invoice, penerimaan callback provider, pembacaan status transaksi, dan rekonsiliasi bila diperlukan. Nama dan keberadaan setiap fungsi harus dipastikan dari repository aktual.

### Supabase PostgreSQL

Database menyimpan state lokal yang menjadi sumber kebenaran bagi pesanan, nominal yang disetujui, referensi transaksi, dan riwayat status sesuai skema yang disetujui. Tabel dan constraint aktual belum ditetapkan oleh dokumen ini.

### Duitku POP

Duitku menangani proses pembayaran eksternal. Backend menggunakan API dan mekanisme callback sesuai dokumentasi resmi untuk integrasi POP yang dipilih.

## 3. Diagram target

~~~text
Frontend
   | Checkout request
   v
Supabase Edge Function
   |-- Validasi request dan otorisasi
   |-- Baca data tepercaya dari PostgreSQL
   |-- Hitung total dan simpan state transaksi
   |-- Create Invoice
   |       v
   |    Duitku POP
   |       |-- Payment URL
   |       |-- HTTP callback
   v
Verifikasi signature dan transaksi
   v
Transisi state yang valid
   v
PostgreSQL
   v
Frontend membaca status otoritatif
~~~

Diagram ini menjelaskan desain logis, bukan hasil tracing kode yang telah diverifikasi.

## 4. Prinsip batas kepercayaan

1. Browser adalah sumber input, bukan sumber kebenaran pembayaran.
2. Database adalah sumber kebenaran lokal untuk pesanan dan nominal yang disimpan.
3. Provider adalah sumber bukti eksternal yang harus diverifikasi dan dicocokkan dengan transaksi lokal.
4. Secret hanya digunakan pada lingkungan server yang berwenang.
5. Callback dapat dikirim ulang; handler harus idempoten.
6. Perubahan payment status, order status, dan inventory harus mengikuti aturan masing-masing.
7. Kegagalan parsial harus dapat dideteksi dan direkonsiliasi.

## 5. Alur invoice

1. Terima permintaan checkout.
2. Validasi format, otorisasi, kuantitas, dan ketersediaan.
3. Ambil harga dan data produk dari sumber tepercaya.
4. Hitung nominal dalam integer IDR.
5. Buat atau identifikasi pesanan menggunakan aturan idempotensi yang disetujui.
6. Kirim request invoice sesuai dokumentasi Duitku.
7. Periksa HTTP response dan status bisnis provider secara terpisah.
8. Simpan referensi provider dan status invoice.
9. Kembalikan hanya data yang diperlukan frontend.

Kegagalan penyimpanan lokal setelah invoice berhasil dibuat harus ditangani sebagai kondisi rekonsiliasi, bukan dengan mengarang status sukses.

## 6. Alur callback

1. Terima request dengan method dan content type yang sesuai dokumentasi provider.
2. Parse field wajib tanpa kehilangan ketepatan nilai.
3. Validasi signature menggunakan secret server.
4. Cocokkan merchant, referensi pesanan, nominal, dan referensi provider.
5. Validasi status sebelumnya dan transisi yang diperbolehkan.
6. Terapkan perubahan database secara atomik atau melalui mekanisme konsistensi yang terdokumentasi.
7. Tangani event duplikat tanpa menerapkan efek bisnis dua kali.
8. Berikan respons sesuai kontrak callback provider.

## 7. Kegagalan parsial dan rekonsiliasi

Desain harus mempertimbangkan invoice berhasil dibuat tetapi referensi gagal disimpan, callback valid diterima ketika database tidak tersedia, callback berulang, perbedaan status provider dan lokal, callback bersamaan dengan expiry/pembatalan, dan pembayaran berhasil ketika stok atau reservasi sudah berubah.

Rekonsiliasi harus menggunakan mekanisme provider yang terdokumentasi dan tidak boleh mengasumsikan endpoint status yang belum diverifikasi.

## 8. Batas tanggung jawab

| Area | Tanggung jawab target |
|---|---|
| Validasi checkout | Backend |
| Harga dan total final | Backend dan data tepercaya |
| Kredensial Duitku | Server-side secret store |
| Signature request | Backend |
| Validasi callback | Backend |
| State pesanan dan pembayaran | Database dengan aturan transisi |
| Navigasi setelah pembayaran | Frontend |
| Bukti status final | Verifikasi server-side |
| Pemulihan kegagalan | Rekonsiliasi dan prosedur operasional |

## 9. Hal yang belum diverifikasi

- Nama dan source Edge Functions aktual.
- Skema database, constraint, trigger, dan RPC.
- Cara frontend memanggil backend.
- Model stok dan reservasi.
- Metode integrasi POP yang benar-benar digunakan.
- Konfigurasi environment dan secrets.
- Mekanisme status-check atau rekonsiliasi yang tersedia pada akun merchant.

## 10. Kriteria penerimaan

- Seluruh komponen aktual dan pemanggilnya telah dipetakan.
- Alur invoice dan callback konsisten dengan kontrak resmi.
- Browser tidak dapat memalsukan status pembayaran.
- Callback duplikat tidak mengulang efek bisnis.
- Kegagalan parsial memiliki jalur pemulihan.
- Status setiap butir didukung bukti audit atau pengujian.
