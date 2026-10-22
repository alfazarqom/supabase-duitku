Asri Collection — Backend API

Backend untuk aplikasi e-commerce Asri Collection, dibangun menggunakan Supabase dan Duitku POP sebagai payment gateway. Repository ini menangani autentikasi, pengelolaan data toko, pembuatan transaksi pembayaran, serta verifikasi status pembayaran melalui backend.

Status: Development / Sandbox
Backend: Supabase
Database: PostgreSQL
Serverless Functions: Supabase Edge Functions
Payment Gateway: Duitku POP
Bahasa: TypeScript
Frontend: React + Vite (repository terpisah)

Daftar Isi

Tentang Proyek

Arsitektur

Teknologi

Fitur

Struktur Repository

Persyaratan

Instalasi

Konfigurasi Environment

Konfigurasi Supabase

Integrasi Duitku POP

Alur Pembayaran

Database dan Keamanan

Pengujian

Deployment

Troubleshooting

Dokumentasi Resmi

Checklist Implementasi

Lisensi

Tentang Proyek

Asri Collection Backend adalah layanan backend untuk mendukung operasional toko pakaian online Asri Collection.

Backend bertanggung jawab atas proses yang tidak boleh dipercayakan sepenuhnya kepada frontend, terutama validasi harga, pembuatan pesanan, integrasi Duitku POP, dan verifikasi pembayaran.

Tujuan

Menyediakan backend terpusat untuk aplikasi e-commerce.

Menyimpan data produk, pesanan, dan pembayaran secara terstruktur.

Mengintegrasikan Duitku POP menggunakan environment Sandbox.

Menjaga kredensial pembayaran agar tidak terekspos kepada pengguna.

Memverifikasi pembayaran melalui mekanisme callback dan pemeriksaan status transaksi yang sesuai dengan dokumentasi Duitku.

Menyediakan API yang dapat digunakan oleh frontend React + Vite.

Arsitektur

Frontend dan backend dikelola dalam repository terpisah.

asri-collection/
│
├── asricollectionapps/       # Frontend React + Vite
│
└── asri-collection-backend/  # Backend Supabase
    ├── supabase/
    ├── README.md
    └── ...

Diagram Arsitektur

┌────────────────────────────┐
│ React + Vite Frontend      │
│ TypeScript                 │
└─────────────┬──────────────┘
              │ HTTPS
              ▼
┌────────────────────────────┐
│ Supabase Edge Functions    │
│                            │
│ - Validasi request         │
│ - Validasi harga           │
│ - Pembuatan pesanan        │
│ - Integrasi Duitku         │
│ - Verifikasi pembayaran    │
└─────────────┬──────────────┘
              │
       ┌──────┴─────────┐
       ▼                ▼
┌───────────────┐  ┌────────────────┐
│ Supabase      │  │ Duitku POP     │
│ PostgreSQL    │  │ Sandbox API    │
│               │  │                │
│ Orders        │  │ Payment URL    │
│ Products      │  │ Transactions   │
│ Payments      │  │ Callbacks      │
└───────────────┘  └────────────────┘

Prinsip Arsitektur

Frontend tidak menyimpan merchant key Duitku.

Frontend tidak menentukan harga akhir pesanan secara otoritatif.

Backend menghitung total pesanan berdasarkan data produk yang tersimpan di database.

Permintaan pembuatan pembayaran dilakukan melalui Edge Function.

Status pembayaran ditetapkan berdasarkan hasil verifikasi server-side yang valid.

Data sensitif disimpan menggunakan Supabase Secrets.

Database dilindungi dengan Row Level Security (RLS) sesuai kebutuhan akses.

Teknologi

Teknologi

Fungsi

Supabase

Backend platform

PostgreSQL

Database

Supabase Edge Functions

API serverless

TypeScript

Bahasa pemrograman backend

Deno

Runtime Edge Functions

Duitku POP

Payment gateway

GitHub

Version control

Supabase CLI

Pengembangan dan deployment

Fitur

Fitur Utama

Konfigurasi proyek Supabase.

Database produk dan kategori.

Database pesanan dan item pesanan.

Database transaksi pembayaran.

Integrasi autentikasi pengguna.

Validasi harga dan stok di backend.

Pembuatan transaksi Duitku POP Sandbox.

Pengembalian informasi pembayaran kepada frontend.

Endpoint callback atau webhook pembayaran.

Validasi tanda tangan callback sesuai dokumentasi Duitku.

Pembaruan status pembayaran secara aman.

Pencegahan pemrosesan callback berulang.

Logging dan penanganan error.

Pengujian integrasi Sandbox.

Checklist ini merupakan target implementasi. Centang setiap fitur setelah kode, konfigurasi, dan pengujiannya benar-benar tersedia di repository.

Struktur Repository

Struktur berikut merupakan rancangan yang disarankan dan dapat disesuaikan dengan implementasi aktual.

asri-collection-backend/
│
├── README.md
├── .gitignore
├── .env.example
├── deno.json
│
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   ├── database-schema.md
│   ├── duitku-integration.md
│   ├── security.md
│   ├── testing.md
│   └── deployment.md
│
├── supabase/
│   ├── config.toml
│   │
│   ├── migrations/
│   │   ├── 0001_create_products.sql
│   │   ├── 0002_create_orders.sql
│   │   ├── 0003_create_order_items.sql
│   │   ├── 0004_create_payments.sql
│   │   └── 0005_configure_rls.sql
│   │
│   ├── functions/
│   │   ├── create-payment/
│   │   │   └── index.ts
│   │   │
│   │   ├── duitku-callback/
│   │   │   └── index.ts
│   │   │
│   │   └── check-payment/
│   │       └── index.ts
│   │
│   └── seed.sql
│
└── tests/
    ├── payment-validation.test.ts
    ├── callback-validation.test.ts
    └── order-validation.test.ts

Catatan: Nama folder dan file di atas adalah rancangan. Sesuaikan dokumentasi ini dengan file yang benar-benar tersedia. Pisahkan fungsi tambahan hanya jika diperlukan oleh alur bisnis dan dokumentasi resmi Duitku.

Persyaratan

Sebelum memulai, siapkan:

Node.js jika diperlukan oleh tooling proyek.

Deno untuk pengembangan atau pengujian lokal Edge Functions sesuai kebutuhan.

Supabase CLI.

Akun Supabase.

Akun merchant Duitku dengan akses Sandbox.

Git.

Repository frontend React + Vite yang akan menggunakan API backend ini.

Instalasi

1. Clone Repository

git clone <BACKEND_REPOSITORY_URL>
cd asri-collection-backend

Ganti <BACKEND_REPOSITORY_URL> dengan URL repository backend yang sebenarnya.

2. Login Supabase

supabase login

3. Hubungkan Proyek

supabase link --project-ref <SUPABASE_PROJECT_REF>

Gunakan project reference dari dashboard Supabase.

4. Jalankan Supabase Secara Lokal

Jika Docker dan kebutuhan lokal lainnya telah tersedia:

supabase start

5. Terapkan Database Migration

supabase db push

Periksa migration sebelum menerapkannya ke proyek yang berisi data penting. Gunakan backup dan prosedur migrasi yang sesuai untuk lingkungan produksi.

6. Jalankan Edge Functions Secara Lokal

Contoh untuk fungsi pembuatan pembayaran:

supabase functions serve create-payment --env-file .env

Ulangi untuk fungsi lain jika diperlukan. Pastikan .env tidak pernah dimasukkan ke Git.

Konfigurasi Environment

Supabase Secrets

Simpan kredensial Duitku sebagai secrets pada proyek Supabase.

Nama variabel yang direkomendasikan:

Variable

Fungsi

DUITKU_MERCHANT_CODE

Identitas merchant Duitku

DUITKU_API_KEY

Merchant API key / kredensial server Duitku sesuai dokumentasi

DUITKU_ENV

Penanda environment, misalnya sandbox

DUITKU_CALLBACK_URL

URL callback publik yang diarahkan ke backend

DUITKU_RETURN_URL

URL halaman frontend setelah pengguna kembali dari pembayaran

Sesuaikan nama variabel dan pemetaan kredensial dengan implementasi kode serta dokumentasi Duitku yang digunakan.

SUPABASE_URL dan SUPABASE_ANON_KEY dapat digunakan pada frontend untuk mengakses layanan Supabase sesuai kebijakan RLS. Jangan menaruh DUITKU_API_KEY atau service_role key di frontend.

Menyimpan Secrets

supabase secrets set DUITKU_MERCHANT_CODE=<MERCHANT_CODE>
supabase secrets set DUITKU_API_KEY=<DUITKU_API_KEY>
supabase secrets set DUITKU_ENV=sandbox
supabase secrets set DUITKU_CALLBACK_URL=<PUBLIC_CALLBACK_URL>
supabase secrets set DUITKU_RETURN_URL=<FRONTEND_RETURN_URL>

Ganti nilai placeholder dengan nilai yang sesuai. Jangan menuliskan kredensial asli ke dokumentasi, commit, log, atau issue publik.

Periksa daftar secrets sesuai kemampuan CLI yang digunakan:

supabase secrets list

Daftar secrets dapat menampilkan nama variabel, bukan berarti nilai rahasianya harus dibagikan.

File .env.example

# Contoh konfigurasi lokal.
# Jangan isi dengan kredensial asli.

DUITKU_MERCHANT_CODE=
DUITKU_API_KEY=
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=
DUITKU_RETURN_URL=

File .env.example hanya untuk mendokumentasikan konfigurasi. Gunakan Supabase Secrets untuk konfigurasi proyek jarak jauh.

Integrasi Duitku POP

Duitku POP menyediakan alur pembayaran yang memungkinkan pengguna memilih metode pembayaran melalui halaman pembayaran Duitku.

Backend harus mengikuti dokumentasi resmi Duitku yang berlaku untuk akun merchant, versi API, dan environment yang digunakan.

Konfigurasi Environment

Untuk pengujian, gunakan environment Sandbox Duitku. Jangan mencampur endpoint, kredensial, atau transaksi Sandbox dengan Production.

Referensi dokumentasi:

Website resmi Duitku

Dokumentasi developer Duitku

Periksa dokumentasi merchant untuk endpoint, parameter request, format signature, format callback, dan prosedur pengecekan status transaksi yang berlaku. Jangan menebak format autentikasi atau signature.

Tanggung Jawab Backend

Menerima permintaan pembuatan pesanan dari frontend.

Memvalidasi pengguna, item produk, kuantitas, harga, dan total pesanan.

Menyimpan pesanan dengan status awal yang sesuai.

Membentuk request pembayaran sesuai dokumentasi Duitku.

Menghitung signature di server jika diwajibkan oleh API.

Mengirim request ke endpoint Sandbox.

Menyimpan referensi transaksi dan data pembayaran yang diperlukan.

Mengembalikan URL pembayaran kepada frontend jika respons Duitku menyediakannya.

Memverifikasi callback atau melakukan pemeriksaan status transaksi sesuai prosedur resmi.

Memperbarui status pesanan secara konsisten.

Batas Keamanan

Jangan membuat request pembayaran langsung dari frontend menggunakan merchant API key.

Jangan mempercayai nilai amount, status, atau payment_method yang dikirim browser sebagai bukti pembayaran.

Jangan menandai pesanan sebagai berhasil hanya karena pengguna kembali ke halaman sukses.

Alur Pembayaran

1. Pengguna memilih produk
          |
          v
2. Frontend mengirim permintaan checkout
          |
          v
3. Edge Function memvalidasi request
          |
          v
4. Backend menghitung total dari database
          |
          v
5. Backend membuat pesanan
          |
          v
6. Backend mengirim request ke Duitku Sandbox
          |
          v
7. Backend menyimpan referensi transaksi
          |
          v
8. Frontend menerima URL pembayaran
          |
          v
9. Pengguna menyelesaikan proses pembayaran
          |
          v
10. Duitku mengirim callback ke backend
          |
          v
11. Backend memvalidasi callback
          |
          v
12. Status pembayaran dan pesanan diperbarui

Status Pesanan

Gunakan status yang eksplisit dan konsisten, misalnya:

pending

paid

failed

expired

cancelled

Sesuaikan status tersebut dengan status resmi Duitku dan kebutuhan bisnis. Jangan menganggap seluruh status provider dapat dipetakan secara langsung tanpa aturan.

Callback harus diproses secara idempoten agar pengiriman notifikasi berulang tidak menyebabkan pembayaran diproses dua kali.

Database dan Keamanan

Tabel yang Disarankan

Tabel

Kegunaan

products

Data produk dan harga

categories

Kategori produk

orders

Informasi pesanan

order_items

Rincian produk dalam pesanan

payments

Referensi transaksi dan status pembayaran

profiles

Data profil pengguna jika diperlukan

Prinsip Database

Gunakan primary key dan foreign key yang sesuai.

Simpan jumlah uang sebagai integer dalam satuan terkecil yang digunakan sistem pembayaran, atau tipe numerik yang tepat; tetapkan satuan secara konsisten.

Validasi jumlah barang dan ketersediaan stok.

Simpan referensi pesanan dan transaksi provider.

Gunakan timestamp untuk pencatatan perubahan.

Terapkan batasan database untuk menjaga integritas data.

Hindari menyimpan data sensitif yang tidak diperlukan.

Row Level Security (RLS)

Aktifkan RLS pada tabel yang diakses melalui Supabase API.

Kebijakan akses minimal:

Pengguna hanya dapat membaca pesanan miliknya.

Pengguna tidak boleh mengubah status pembayaran secara langsung.

Pengguna tidak boleh mengubah harga produk resmi melalui request checkout.

Operasi administratif dibatasi pada peran yang berwenang.

Callback pembayaran diproses melalui backend tepercaya, bukan melalui akses publik langsung ke tabel.

Jika Edge Function menggunakan service_role key, batasi penggunaannya di server dan lakukan otorisasi secara eksplisit. Kunci tersebut melewati perlindungan RLS sehingga tidak boleh diperlakukan seperti kunci publik.

Verifikasi Callback

Callback pembayaran harus:

Memvalidasi field wajib dan format data.

Memverifikasi signature sesuai dokumentasi resmi Duitku.

Mencocokkan merchant, referensi pesanan, jumlah, dan referensi transaksi.

Memastikan transaksi memang berkaitan dengan pesanan yang benar.

Menangani callback duplikat dengan aman.

Menolak perubahan status yang tidak valid.

Mengembalikan respons yang sesuai dengan protokol callback Duitku.

Jika diperlukan, lakukan pengecekan status transaksi melalui mekanisme server-to-server resmi sebelum menetapkan status final. Jangan menganggap callback yang hanya memiliki format JSON valid sebagai bukti pembayaran.

API Contract

Endpoint berikut merupakan rancangan kontrak API. Sesuaikan nama fungsi, method, payload, dan respons dengan implementasi aktual.

Endpoint

Method

Tujuan

/functions/v1/create-payment

POST

Membuat pesanan atau transaksi pembayaran

/functions/v1/duitku-callback

POST

Menerima notifikasi pembayaran

/functions/v1/check-payment

POST

Memeriksa status transaksi

Contoh Request create-payment

{
  "items": [
    {
      "product_id": "PRODUCT_UUID",
      "quantity": 2
    }
  ],
  "customer": {
    "name": "Nama Pelanggan",
    "email": "pelanggan@example.com",
    "phone": "08xxxxxxxxxx"
  }
}

Payload ini adalah ilustrasi. Backend harus mengambil harga dan informasi produk yang valid dari database, bukan mempercayai harga yang dikirim klien.

Contoh Respons

{
  "success": true,
  "order_id": "ORDER_UUID",
  "payment_url": "PAYMENT_URL_FROM_PROVIDER"
}

Respons tersebut hanya contoh format kontrak. Nama field, nilai, dan penanganan error harus disesuaikan dengan hasil implementasi.

Jangan mengembalikan merchant API key, signature rahasia, atau kredensial internal kepada frontend.

Pengujian

Pengujian Lokal

Jalankan pemeriksaan dan pengujian sesuai toolchain yang digunakan.

Contoh:

supabase start
supabase functions serve create-payment --env-file .env

Checklist Pengujian

Permintaan checkout valid berhasil diproses.

Produk yang tidak ditemukan ditolak.

Kuantitas nol atau negatif ditolak.

Harga dari frontend tidak digunakan sebagai sumber kebenaran.

Pesanan tidak dapat diakses pengguna lain.

Request Duitku Sandbox menggunakan konfigurasi yang benar.

Kegagalan request provider ditangani tanpa membuat status paid.

Signature callback yang tidak valid ditolak.

Callback dengan jumlah atau referensi yang tidak cocok ditolak.

Callback duplikat tidak memproses transaksi berulang.

Pengguna tidak dapat mengubah status pembayaran melalui API publik.

Secret tidak muncul dalam log atau respons error.

Status pembayaran diperbarui sesuai hasil verifikasi.

Alur pembayaran diuji end-to-end menggunakan fasilitas Sandbox.

Lakukan pengujian menggunakan data transaksi Sandbox. Jangan menguji alur ini dengan kredensial Production.

Deployment

1. Siapkan Proyek Supabase

Buat proyek melalui Supabase Dashboard.

2. Konfigurasikan Secrets

Masukkan seluruh kredensial dan URL yang diperlukan melalui Supabase Secrets.

3. Terapkan Migration

supabase link --project-ref <SUPABASE_PROJECT_REF>
supabase db push

4. Deploy Edge Functions

supabase functions deploy create-payment
supabase functions deploy duitku-callback
supabase functions deploy check-payment

Pastikan nama fungsi sesuai dengan direktori yang tersedia.

Periksa konfigurasi autentikasi setiap fungsi. Fungsi callback publik mungkin perlu menerima request dari Duitku tanpa JWT pengguna, tetapi wajib melakukan validasi signature dan pemeriksaan transaksi secara server-side. Jangan menonaktifkan autentikasi untuk seluruh fungsi tanpa alasan yang jelas.

5. Konfigurasikan URL Callback

Gunakan URL publik Edge Function yang sesuai dengan nama fungsi yang telah di-deploy.

Contoh pola URL:

https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/duitku-callback

Daftarkan URL tersebut sesuai mekanisme konfigurasi callback pada akun merchant Duitku. Pastikan endpoint dapat diakses oleh sistem Duitku dan menerapkan verifikasi yang benar.

6. Integrasikan Frontend

Frontend React + Vite memanggil Edge Function menggunakan URL proyek Supabase.

Contoh variabel frontend:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

Variabel berawalan VITE_ dapat terekspos dalam bundle frontend. Jangan pernah memasukkan merchant API key Duitku atau Supabase service_role key ke variabel tersebut.

7. Verifikasi Deployment

Periksa log Edge Functions.

Jalankan checkout Sandbox.

Pastikan URL pembayaran dapat dibuka.

Periksa callback yang masuk.

Cocokkan status transaksi dengan dashboard atau mekanisme verifikasi resmi Duitku.

Uji penanganan error dan callback duplikat.

Troubleshooting

Masalah

Pemeriksaan

Secret tidak terbaca

Periksa nama variabel, konfigurasi environment, dan deployment

Pembuatan pembayaran gagal

Periksa payload, kredensial Sandbox, endpoint, dan respons Duitku

Signature tidak valid

Periksa rumus, urutan parameter, encoding, dan tipe data sesuai dokumentasi

Callback tidak diterima

Periksa URL publik, konfigurasi merchant, dan log fungsi

Status pembayaran tidak berubah

Periksa validasi callback, pemetaan status, dan operasi database

Frontend mendapatkan 401

Periksa JWT, konfigurasi autentikasi fungsi, dan header request

Frontend mendapatkan 403

Periksa otorisasi pengguna dan kebijakan RLS

Pesanan ganda

Periksa idempotensi checkout dan penanganan request berulang

Jangan menampilkan API key, token, signature rahasia, atau data pribadi pelanggan ketika membagikan log error untuk keperluan debugging.

Dokumentasi Resmi

Supabase Documentation

Supabase Edge Functions

Supabase Database

Supabase Row Level Security

Supabase CLI

Duitku Official Website

Duitku Developer Documentation

Gunakan dokumentasi resmi Duitku untuk memastikan endpoint Sandbox, parameter POP, signature, callback, dan prosedur pemeriksaan status transaksi sesuai dengan versi integrasi yang digunakan.

Checklist Implementasi

Backend

Proyek Supabase tersedia.

Migration database tersedia dan dapat dijalankan.

RLS aktif dan telah diuji.

Edge Functions selesai diimplementasikan.

Validasi checkout dilakukan di server.

Secrets telah dikonfigurasi.

Integrasi Duitku POP Sandbox berhasil.

Callback diverifikasi.

Pembaruan status transaksi aman dan idempoten.

Pengujian otomatis dan manual telah dilakukan.

Integrasi Frontend

Frontend menggunakan URL dan kunci publik Supabase yang benar.

Frontend mengirim request sesuai kontrak API.

URL pembayaran ditangani dengan benar.

Halaman kembali dari pembayaran tidak menjadi sumber kebenaran status.

Status pesanan diperoleh dari backend.

Tidak ada kredensial server dalam bundle frontend.

Kesiapan Produksi

Kredensial Production terpisah dari Sandbox.

URL callback Production telah dikonfigurasi.

Verifikasi pembayaran diuji kembali di environment Production yang sesuai.

Logging tidak membocorkan data sensitif.

Backup, monitoring, dan penanganan kegagalan telah disiapkan.

Kebijakan keamanan dan akses database telah ditinjau.

Lisensi

Tentukan lisensi proyek sebelum mendistribusikan atau menggunakan ulang kode secara publik.

Jika repository menggunakan kode atau dependensi pihak ketiga, patuhi lisensi masing-masing.

Asri Collection Backend
Supabase + Duitku POP Sandbox

Dokumentasi ini merupakan panduan implementasi. Sesuaikan nama endpoint, variabel environment, struktur database, dan perilaku callback dengan kode aktual serta dokumentasi resmi Duitku yang berlaku.
