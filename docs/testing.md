# Strategi Pengujian Backend Supabase × Duitku POP

- Status: PROPOSED
- Pengujian yang sudah dijalankan: NOT VERIFIED dalam draft ini
- Environment target: lokal dan Duitku Sandbox

## 1. Tujuan

Memastikan validasi checkout, pembuatan invoice, callback, perubahan status, akses data, dan pemulihan kegagalan berjalan sesuai kontrak yang disetujui.

Tes tidak boleh dianggap lulus hanya karena fungsi berhasil di-deploy atau request mengembalikan HTTP 200.

## 2. Kategori pengujian

1. Unit test: validasi input, perhitungan nominal, pemetaan status, dan fungsi signature.
2. Contract test: request dan respons sesuai kontrak provider serta API lokal.
3. Integration test: Edge Functions berinteraksi dengan database dan provider Sandbox.
4. Security test: otorisasi, RLS, signature, dan perlindungan data.
5. Concurrency test: callback atau checkout yang berlangsung bersamaan.
6. Regression test: perilaku lama yang harus tetap berjalan.
7. End-to-end test: alur checkout sampai status diperoleh dari backend.

Nama framework dan perintah tes final harus disesuaikan dengan toolchain aktual.

## 3. Checkout dan pembuatan invoice

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| CHK-001 | Request checkout valid | Diproses sesuai kontrak |
| CHK-002 | Item kosong | Ditolak |
| CHK-003 | Produk tidak ditemukan | Ditolak |
| CHK-004 | Kuantitas nol atau negatif | Ditolak |
| CHK-005 | Harga klien dimodifikasi | Tidak menjadi harga otoritatif |
| CHK-006 | Stok tidak mencukupi | Ditolak sesuai model stok |
| CHK-007 | Secret provider tidak tersedia | Gagal secara aman |
| CHK-008 | Provider mengembalikan error bisnis | Tidak menandai pembayaran berhasil |
| CHK-009 | Request duplikat | Tidak menciptakan efek transaksi yang tidak diinginkan |

## 4. Signature dan callback

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| CB-001 | Signature valid dan transaksi cocok | Diproses sesuai state transition |
| CB-002 | Signature tidak valid | Ditolak |
| CB-003 | Secret tidak tersedia | Ditolak secara aman |
| CB-004 | Field wajib hilang | Ditolak |
| CB-005 | Merchant order reference tidak cocok | Tidak mengubah transaksi |
| CB-006 | Nominal tidak cocok | Tidak mengubah transaksi |
| CB-007 | Referensi provider tidak cocok | Ditolak atau masuk jalur investigasi yang ditetapkan |
| CB-008 | Callback duplikat | Tidak mengulang efek bisnis |
| CB-009 | Callback bersamaan | Tidak terjadi pembaruan ganda |
| CB-010 | Content type tidak sesuai | Ditangani secara aman |
| CB-011 | Status provider bukan pembayaran berhasil | Tidak ditandai paid |
| CB-012 | Transaksi tidak dikenal | Tidak mengubah pesanan lain |

## 5. Database dan status

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| DB-001 | Pengguna membaca pesanan miliknya | Diizinkan sesuai kebijakan |
| DB-002 | Pengguna membaca pesanan orang lain | Ditolak |
| DB-003 | Pengguna mengubah status pembayaran langsung | Ditolak |
| DB-004 | Constraint unik dilanggar | Tidak menghasilkan data ganda |
| DB-005 | Update transaksi gagal | Tidak meninggalkan state setengah jadi tanpa mekanisme pemulihan |
| DB-006 | Callback berlomba dengan expiry | Transisi akhir mengikuti aturan yang disetujui |
| DB-007 | Pembaruan stok berulang | Efek stok sesuai kontrak dan tidak berulang |
| DB-008 | Dua checkout bersamaan | Batas stok dan integritas tetap terjaga |

## 6. Browser return dan status

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| RT-001 | Pengguna kembali ke halaman sukses | Status tetap mengikuti backend |
| RT-002 | Query parameter status diubah | Tidak mengubah status transaksi |
| RT-003 | Pengguna meminta status pesanan lain | Ditolak |
| RT-004 | Status provider dan lokal berbeda | Ditangani melalui prosedur rekonsiliasi |
| RT-005 | Callback terlambat | State diperbarui sesuai aturan transisi yang sah |

## 7. Sandbox

Sebelum pengujian:
- Konfirmasikan kredensial dan endpoint merupakan Sandbox.
- Pastikan URL callback mengarah ke lingkungan yang tepat.
- Gunakan data uji.
- Hindari pembayaran nyata.
- Jangan mencetak secret atau data pelanggan ke log.
- Catat referensi transaksi uji dengan aman.

## 8. Bukti hasil tes

| Field | Isi |
|---|---|
| Test ID | ID skenario |
| Tanggal/waktu | Waktu tes |
| Commit | Commit yang diuji |
| Environment | Lokal atau Sandbox |
| Expected | Hasil yang diharapkan |
| Actual | Hasil yang diamati |
| Status | PASS / FAIL / NOT RUN |
| Evidence | Log atau hasil tes yang disanitasi |
| Catatan | Risiko dan tindak lanjut |

Jangan menandai PASS jika tes belum dijalankan atau hasil aktual tidak diketahui.

## 9. Gerbang kelulusan

Sebelum menyatakan siap untuk Sandbox end-to-end, tes validasi request, signature positif dan negatif, callback duplikat, nominal/referensi yang tidak cocok, otorisasi, isolasi data, status, dan konsistensi database harus memiliki hasil yang dapat ditinjau.

Sebelum Production, diperlukan tinjauan tambahan untuk konfigurasi, observabilitas, pemulihan kegagalan, backup, akses, dan persetujuan deployment terpisah.
