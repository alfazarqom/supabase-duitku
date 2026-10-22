# Pengembangan, Konfigurasi, dan Deployment

- Status: PROPOSED
- Deployment yang dilakukan oleh dokumen ini: Tidak ada
- Lingkungan aktual: NOT VERIFIED

## 1. Prinsip perubahan

Panduan ini tidak memberikan izin untuk menjalankan migration, mengubah secrets, mengubah konfigurasi proyek, atau melakukan deployment.

Setiap tindakan yang memengaruhi sistem harus memiliki target project/environment yang jelas, daftar objek terdampak, perubahan spesifik, rencana validasi, rencana rollback/pemulihan, dan persetujuan eksplisit sebelum eksekusi.

## 2. Persiapan lokal

Clone repository:

~~~bash
git clone https://github.com/alfazarqom/supabase-duitku.git
cd supabase-duitku
~~~

Periksa branch dan perubahan lokal:

~~~bash
git status --short
git branch --show-current
git log -1 --oneline
~~~

Periksa file konfigurasi aktual sebelum menjalankan perintah Supabase. Jangan mengasumsikan folder migration atau Edge Functions tersedia hanya karena disebut dalam dokumentasi lama.

## 3. Supabase CLI

Gunakan versi CLI yang sesuai dengan proyek dan dokumentasikan versi yang dipakai saat tes.

Untuk menjalankan stack lokal, jika konfigurasi proyek telah tersedia dan ditinjau:

~~~bash
supabase start
~~~

Untuk menjalankan fungsi lokal, gunakan nama direktori aktual. Contoh berikut hanya pola umum:

~~~bash
supabase functions serve <NAMA_FUNGSI> --env-file <PATH_FILE_ENV>
~~~

Pastikan file environment tidak masuk Git. Jangan mengasumsikan lokasi file environment tanpa memeriksa struktur yang digunakan.

## 4. Secrets

Nama variabel final harus dicocokkan dengan source code. Kategori konfigurasi yang mungkin dibutuhkan: merchant code, merchant API key, environment provider, callback URL, return URL, dan konfigurasi tambahan yang benar-benar digunakan fungsi.

Gunakan mekanisme secrets Supabase untuk proyek jarak jauh. Jangan memasukkan nilai secret ke dokumentasi, source code, frontend, issue, atau output terminal yang dibagikan.

Pemeriksaan konfigurasi hanya boleh memastikan keberadaan atau nama variabel jika dapat dilakukan dengan aman; nilai secret tidak perlu dibaca atau ditampilkan.

## 5. Database migration

Sebelum migration dijalankan:
1. Inventarisasi seluruh file migration.
2. Bandingkan dengan skema database target.
3. Identifikasi perubahan data dan objek yang terdampak.
4. Tinjau constraint, RLS, grants, dan dependensi.
5. Pastikan backup atau prosedur pemulihan memadai.
6. Tentukan target environment secara eksplisit.
7. Dapatkan persetujuan khusus untuk eksekusi.

Jangan menjalankan `supabase db push` hanya karena perintah tersebut ada di contoh README. Perintah itu dapat mengubah database target sesuai konfigurasi CLI.

## 6. Deployment Edge Functions

Sebelum deploy:
- Pastikan source function telah ditinjau.
- Pastikan nama fungsi sesuai direktori aktual.
- Pastikan environment dan secrets benar.
- Pastikan kebijakan JWT sesuai kebutuhan tiap fungsi.
- Pastikan callback signature dan validasi transaksi telah diuji.
- Jalankan tes yang diwajibkan.
- Dokumentasikan commit yang akan dirilis.
- Dapatkan persetujuan deployment secara eksplisit.

Perintah deploy harus menyebutkan fungsi dan target yang telah disetujui. Jangan deploy seluruh fungsi sebagai efek samping perubahan dokumentasi.

## 7. Callback URL

URL callback harus mengarah ke fungsi yang benar-benar tersedia, menggunakan project reference dan environment yang benar, dapat dijangkau provider, memvalidasi callback sesuai kontrak resmi, dan tidak menampilkan secret.

Contoh pola URL, bukan endpoint yang telah diverifikasi:

~~~text
https://<PROJECT_REF>.supabase.co/functions/v1/<CALLBACK_FUNCTION>
~~~

Daftarkan URL pada konfigurasi merchant hanya setelah target deployment dan endpoint disetujui.

## 8. Frontend

Anggap variabel build-time frontend dapat terlihat di bundle browser. Hanya URL dan public/publishable key yang sesuai desain boleh berada di frontend.

Jangan menempatkan Duitku merchant API key, Supabase service-role key, secret signature, atau kredensial database dalam frontend.

Kontrak API harus diuji terhadap versi frontend yang memanggilnya.

## 9. Checklist sebelum Sandbox

- [ ] Struktur source dan migration telah diaudit.
- [ ] Konfigurasi lokal sesuai source.
- [ ] Secrets Sandbox telah dikonfigurasi oleh operator berwenang.
- [ ] Endpoint dan signature sesuai dokumentasi resmi.
- [ ] Callback URL sesuai target.
- [ ] Tes negatif signature dan validasi nominal lulus.
- [ ] Callback duplikat dan perubahan status diuji.
- [ ] Log aman dari secret dan data sensitif.
- [ ] Target Sandbox telah dikonfirmasi.

## 10. Checklist sebelum Production

- [ ] Audit keamanan selesai.
- [ ] Hasil Sandbox tersedia dan dapat direproduksi.
- [ ] Migration dan dampaknya ditinjau.
- [ ] Backup dan prosedur pemulihan tersedia.
- [ ] Secrets Production dikelola secara terpisah.
- [ ] URL callback Production diverifikasi.
- [ ] Monitoring dan penanganan kegagalan disiapkan.
- [ ] Risiko tersisa diterima pemilik sistem.
- [ ] Persetujuan deployment Production diberikan secara eksplisit.

## 11. Rollback dan pemulihan

Rencana harus menjelaskan cara mengidentifikasi commit dan fungsi yang dirilis, memulihkan versi kode jika kompatibel dengan state database, menangani migration yang tidak dapat dibatalkan secara aman, merekonsiliasi invoice yang telah dibuat, memulihkan transaksi yang tidak konsisten, dan mencegah rollback kode menimbulkan efek ganda.

Rollback kode tidak otomatis membatalkan transaksi provider atau memulihkan data database.

## 12. Kriteria penerimaan

- Setiap environment memiliki konfigurasi yang terdokumentasi.
- Target deployment dan perubahan database eksplisit.
- Secrets tidak terekspos.
- Tes wajib memiliki bukti.
- Rollback/pemulihan sesuai perubahan yang direncanakan.
- Tidak ada deployment atau migration tanpa persetujuan khusus.
