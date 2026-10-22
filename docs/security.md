# Persyaratan Keamanan Backend

- Status: PROPOSED
- Audit konfigurasi keamanan aktual: NOT VERIFIED

## 1. Tujuan

Dokumen ini menetapkan kontrol keamanan yang harus diverifikasi pada Supabase, Edge Functions, database, dan integrasi Duitku POP.

## 2. Klasifikasi data

| Data | Perlakuan |
|---|---|
| Merchant API key Duitku | Rahasia server; tidak boleh dibagikan |
| Supabase service-role key | Rahasia server; hak akses istimewa |
| Supabase publishable/anon key | Dapat digunakan di klien sesuai desain akses dan RLS |
| Signature request/callback | Jangan log mentah jika tidak diperlukan |
| Informasi pesanan | Akses berdasarkan hak pengguna |
| Informasi pribadi pelanggan | Minimalkan penyimpanan dan paparan |
| Status pembayaran | Hanya diperbarui oleh jalur tepercaya |

Klasifikasi ini merupakan pedoman desain, bukan laporan pemeriksaan secrets aktual.

## 3. Secrets dan konfigurasi

- Simpan kredensial server pada Supabase Secrets atau secret manager yang disetujui.
- Jangan menaruh merchant API key atau service-role key dalam kode frontend, variabel `VITE_*`, dokumentasi, migration, fixture, atau log.
- Jangan mencetak nilai secret ketika memeriksa konfigurasi.
- Gunakan konfigurasi terpisah untuk Sandbox dan Production.
- Validasi keberadaan konfigurasi wajib sebelum operasi pembayaran.
- Jika secret yang diperlukan tidak tersedia, gagal secara aman; jangan melewati verifikasi signature.

Nama variabel final harus ditetapkan setelah source code diperiksa.

## 4. Autentikasi dan otorisasi Edge Functions

Untuk setiap fungsi, dokumentasikan apakah JWT diwajibkan, identitas/peran pemanggil, dukungan alur guest, data yang dapat dibaca/diubah, cara otorisasi diperiksa, dan penanganan error akses.

Callback provider dapat memerlukan endpoint yang menerima request tanpa JWT pengguna. Hal ini bukan alasan untuk menonaktifkan autentikasi pada semua fungsi.

Fungsi callback harus memvalidasi signature provider dan memastikan event berhubungan dengan transaksi lokal yang sah.

## 5. Database, RLS, dan grants

- Periksa apakah RLS aktif.
- Periksa policies untuk `anon`, `authenticated`, dan peran relevan lainnya.
- Periksa grants dan hak eksekusi RPC.
- Audit fungsi `SECURITY DEFINER`, termasuk `search_path` dan validasi otorisasi.
- Pastikan pengguna tidak dapat membaca atau mengubah pesanan pihak lain.
- Pastikan pengguna biasa tidak dapat mengubah nominal resmi atau status pembayaran.
- Hindari memperluas grants untuk mengatasi error tanpa memahami penyebabnya.

Jika Edge Function menggunakan service-role key, RLS mungkin bukan kontrol otorisasi utama untuk operasi tersebut. Otorisasi harus diterapkan secara eksplisit di backend.

## 6. Validasi callback

Sebelum perubahan state:
1. Validasi struktur request.
2. Validasi signature menggunakan formula resmi.
3. Validasi merchant dan referensi pesanan.
4. Cocokkan nominal.
5. Cocokkan referensi transaksi provider bila tersedia.
6. Periksa state sebelumnya.
7. Terapkan hanya perubahan yang diizinkan.
8. Tangani event berulang secara idempoten.

Jangan menerima status pembayaran dari frontend sebagai pengganti validasi callback atau verifikasi server-to-server yang sesuai.

## 7. Idempotensi dan race condition

Kontrol harus mencegah callback yang sama memproses pembayaran dua kali, checkout bersamaan menimbulkan efek bisnis ganda, expiry mengalahkan pembayaran valid secara tidak semestinya, stok berubah lebih dari sekali, dua pengguna melewati batas ketersediaan, atau status pesanan dan pembayaran menjadi tidak konsisten.

Audit unique constraint, transaksi database, RPC, dan aturan transisi aktual sebelum menetapkan implementasi.

## 8. Logging dan penanganan error

Log sebaiknya memuat ID korelasi aman, kategori hasil, waktu proses, kategori kegagalan, dan hasil verifikasi yang tidak sensitif.

Jangan mencatat API key, service-role key, raw authorization header, nilai secret, payload pelanggan lengkap tanpa kebutuhan sah, atau data pembayaran sensitif yang tidak diperlukan.

Respons error harus aman dan tidak mengungkapkan stack trace atau detail internal.

## 9. Abuse prevention

Evaluasi kebutuhan untuk rate limit endpoint publik, batas ukuran request, batas kuantitas item, timeout provider, perlindungan replay, pembatasan akses status pesanan, serta monitoring kegagalan signature dan request berulang.

Jangan menganggap IP allowlist sebagai pengganti signature verification. Gunakan hanya jika didukung dan dapat dipelihara dengan benar.

## 10. Model ancaman minimum

| Ancaman | Kontrol yang diusulkan |
|---|---|
| Klien mengubah nominal | Hitung total di backend |
| Klien memalsukan status paid | Status hanya dari verifikasi server-side |
| Callback palsu | Signature dan pencocokan transaksi |
| Callback replay | Idempotensi dan aturan transisi |
| Kebocoran API key | Secret server-side dan redaksi log |
| Akses pesanan pengguna lain | Otorisasi dan RLS yang tepat |
| Race condition | Constraint dan operasi database atomik |
| Salah environment | Konfigurasi Sandbox/Production terpisah |

## 11. Kriteria penerimaan

- Secrets tidak terekspos.
- Auth dan otorisasi tiap endpoint terdokumentasi.
- RLS, policies, grants, dan RPC diperiksa.
- Signature gagal jika secret tidak ada atau signature tidak valid.
- Callback tidak dapat mengubah transaksi yang tidak cocok.
- Akses lintas pengguna ditolak.
- Log tidak membocorkan data sensitif.
- Temuan keamanan ditandai PASS, FAIL, atau NOT VERIFIED dengan bukti.
