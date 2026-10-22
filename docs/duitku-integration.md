# Integrasi Duitku POP

- Status: PROPOSED
- Environment pengujian target: Sandbox
- Hasil integrasi aktual: NOT VERIFIED
- Sumber utama: https://docs.duitku.com/pop/id/

## 1. Tujuan

Dokumen ini menetapkan persyaratan integrasi backend dengan Duitku POP. Detail request, signature, callback, dan status transaksi harus diverifikasi terhadap dokumentasi resmi yang berlaku pada saat implementasi.

Jangan mengambil formula dari produk Duitku lain atau contoh lama tanpa memastikan bahwa formula tersebut berlaku untuk POP yang digunakan.

## 2. Mode integrasi

Tentukan mode yang benar-benar digunakan oleh proyek: Create Invoice di server dan redirect ke payment URL, atau mode POP lain yang secara eksplisit dikonfigurasi dan didukung akun merchant.

Mode integrasi belum diverifikasi melalui source code. Jangan mengubah mode tanpa persetujuan.

## 3. Pemisahan environment

Sandbox dan Production harus menggunakan endpoint, kredensial, callback URL, dan pencatatan transaksi yang sesuai serta dapat dibedakan.

Jika environment atau kredensial wajib tidak tersedia, backend harus gagal secara aman. Jangan melakukan fallback otomatis dari Production ke Sandbox atau sebaliknya.

Endpoint dan parameter aktual harus dikonfirmasi melalui dokumentasi resmi: https://docs.duitku.com/pop/id/

## 4. Pembuatan invoice

Backend harus:
1. Memvalidasi checkout.
2. Mengambil harga dari sumber data tepercaya.
3. Menghitung nominal final.
4. Menggunakan merchant order reference yang konsisten.
5. Menghasilkan request signature dengan formula resmi.
6. Mengirim request ke endpoint yang sesuai environment.
7. Memeriksa HTTP status dan status bisnis pada respons provider secara terpisah.
8. Memvalidasi field respons yang wajib.
9. Menyimpan referensi provider dan status invoice.
10. Mengembalikan hanya data yang diperlukan frontend.

HTTP 200 saja tidak membuktikan invoice berhasil. Backend harus memeriksa respons bisnis dan field yang disyaratkan provider.

## 5. Request signature

Formula, nama header, timestamp, urutan parameter, encoding, algoritma, dan format signature harus diambil dari bagian Create Invoice pada dokumentasi resmi POP.

Sebelum implementasi:
- Catat URL bagian dokumentasi dan tanggal pemeriksaan.
- Catat formula persis sesuai dokumen.
- Buat tes deterministik berdasarkan contoh resmi jika tersedia.
- Verifikasi tipe data dan format nominal.
- Pastikan signature dibuat hanya di server.
- Pastikan secret tidak pernah dikirim ke browser atau log.

Jangan menambahkan formula baru berdasarkan asumsi.

## 6. HTTP callback

Callback harus:
1. Menggunakan method dan content type sesuai dokumentasi.
2. Membaca field wajib dengan parser yang sesuai.
3. Memvalidasi signature menggunakan secret server.
4. Menolak callback jika signature tidak valid atau secret tidak tersedia.
5. Mencocokkan merchant code, merchant order reference, nominal, dan referensi transaksi.
6. Memastikan transaksi dikenal oleh database.
7. Memeriksa status sebelumnya dan transisi yang diizinkan.
8. Memperbarui state secara atomik atau melalui mekanisme konsistensi yang disetujui.
9. Menangani callback duplikat secara idempoten.
10. Mengembalikan respons sesuai kontrak callback resmi.

Jangan menganggap payload JSON sebagai format universal callback. Periksa content type dan kontrak provider yang berlaku.

Validasi signature saja tidak cukup jika nominal atau referensi transaksi tidak cocok dengan catatan lokal.

## 7. Browser return dan JavaScript callback

Return URL dan JavaScript callback dapat digunakan untuk navigasi serta pengalaman pengguna. Keduanya bukan bukti pembayaran final karena browser dapat mengubah query parameter atau mengirim request sendiri.

Setelah kembali dari halaman pembayaran, frontend harus mengambil status dari endpoint backend yang berwenang.

## 8. Status dan rekonsiliasi

Status provider harus dipetakan ke status lokal melalui aturan terdokumentasi. Jangan menganggap seluruh status provider identik dengan status pesanan.

Rekonsiliasi diperlukan jika callback tidak diterima, callback valid gagal disimpan, provider dan status lokal tidak cocok, callback dikirim ulang, atau pembayaran selesai ketika transaksi lokal sedang berubah.

Gunakan hanya mekanisme inquiry atau status-check yang resmi didukung untuk integrasi dan akun merchant yang digunakan. Jangan menebak endpoint status.

Rekonsiliasi harus memeriksa referensi transaksi, memvalidasi nominal dan status provider, menerapkan perubahan secara idempoten, membatasi frekuensi request, mencatat hasil secara aman, dan tidak memperbarui status berdasarkan input browser saja.

## 9. Kegagalan dan retry

Rencana harus menjelaskan timeout saat membuat invoice, error provider, invoice dibuat tetapi referensinya gagal disimpan, callback berulang, database gagal ketika callback diproses, dan perbedaan status provider dengan status lokal.

Retry tidak boleh membuat transaksi ganda secara tidak terkendali. Kebijakan retry harus mengikuti kontrak provider dan aturan idempotensi lokal.

## 10. Pengujian Sandbox

Kasus minimal:
- Request invoice valid.
- Signature request tidak valid.
- Secret tidak tersedia.
- Respons provider dengan error bisnis.
- Callback valid.
- Callback dengan signature tidak valid.
- Nominal atau merchant order reference tidak cocok.
- Callback berulang atau bersamaan.
- Kegagalan database ketika callback diproses.
- Return URL dengan parameter yang dimodifikasi.
- Status provider dan database tidak cocok.

Jangan menggunakan pembayaran nyata sebagai pengganti tes Sandbox. Catat environment, waktu, hasil aktual, dan bukti yang aman dibagikan.

## 11. Sumber resmi

- Duitku POP: https://docs.duitku.com/pop/id/
- Situs Duitku: https://www.duitku.com/
- FAQ Duitku: https://www.duitku.com/frequently-asked-questions/

Periksa kembali dokumen resmi sebelum implementasi. Dokumentasi provider dapat berubah; catat tanggal verifikasi dan bagian yang menjadi dasar implementasi.

## 12. Kriteria penerimaan

- Mode integrasi aktual teridentifikasi.
- Request signature sesuai dokumentasi resmi.
- Callback parsing dan signature sesuai dokumentasi.
- Nominal dan referensi transaksi dicocokkan.
- Browser return tidak dapat mengonfirmasi pembayaran.
- Callback duplikat aman.
- Kegagalan parsial memiliki prosedur pemulihan.
- Hasil tes Sandbox tersedia.
