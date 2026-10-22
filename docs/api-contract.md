# Kontrak API Backend

- Status: PROPOSED
- Endpoint aktual: NOT VERIFIED
- Kontrak final hanya ditetapkan setelah source code dan pemanggil frontend diperiksa.

## 1. Prinsip

Kontrak API harus sesuai dengan implementasi aktual. Nama fungsi di bawah adalah nama logis yang diusulkan dan bukan bukti bahwa endpoint sudah tersedia.

Semua endpoint harus memvalidasi method dan content type, field wajib dan tipe data, menggunakan nominal dan data produk tepercaya, mengembalikan error konsisten tanpa membocorkan detail internal, serta memisahkan autentikasi, otorisasi, dan validasi pembayaran.

## 2. Endpoint logis yang diusulkan

| Nama logis | Method | Tujuan | Akses |
|---|---|---|---|
| Create payment | POST | Membuat atau memulai transaksi pembayaran | Pengguna terotorisasi atau alur guest yang dirancang |
| Duitku callback | POST | Menerima notifikasi provider | Endpoint publik provider dengan verifikasi signature |
| Check payment status | GET atau POST | Menampilkan status transaksi | Pengguna yang berhak atau akses guest berbasis token aman |
| Reconcile payment | Internal/terbatas | Memeriksa dan memperbaiki ketidaksesuaian | Akses internal yang sangat terbatas |

Method dan nama final harus ditentukan berdasarkan source code, dokumentasi provider, dan kebutuhan bisnis.

## 3. Create payment

### Request konseptual

~~~json
{
  "items": [
    {
      "product_id": "PRODUCT_ID",
      "quantity": 2
    }
  ],
  "customer": {
    "name": "Nama Pelanggan",
    "email": "pelanggan@example.com",
    "phone": "Nomor yang valid"
  }
}
~~~

Payload ini hanya ilustrasi kontrak. Field identitas dan format ID harus mengikuti kebutuhan autentikasi serta skema aktual.

### Validasi

- Daftar item tidak kosong.
- ID produk valid dan dapat ditemukan.
- Kuantitas berupa bilangan bulat positif dengan batas maksimum yang ditetapkan.
- Harga diambil dari database, bukan dari browser.
- Ketersediaan stok diperiksa dengan mempertimbangkan konkurensi.
- Ongkir dan total mengikuti proses persetujuan bisnis yang berlaku.
- Referensi transaksi tidak dapat digunakan untuk mengakses pesanan milik pihak lain.
- Request berulang ditangani sesuai kebijakan idempotensi.

### Respons konseptual

~~~json
{
  "success": true,
  "order_id": "ORDER_ID",
  "payment_url": "URL_DARI_PROVIDER"
}
~~~

Nama field final belum disetujui. `payment_url` hanya boleh berisi URL yang benar-benar diterima dan divalidasi dari respons provider.

### Error

| Kondisi | Kategori respons yang diusulkan |
|---|---|
| JSON atau field tidak valid | 400 |
| Tidak terautentikasi | 401 |
| Tidak memiliki akses | 403 |
| Produk tidak ditemukan | 404 |
| State konflik atau request duplikat | 409 |
| Kegagalan provider atau internal | 5xx yang sesuai |

Status HTTP final harus sesuai dengan implementasi dan kontrak klien yang disetujui.

## 4. Duitku callback

Callback mengikuti method, content type, field, signature, dan respons yang ditetapkan dokumentasi resmi Duitku POP untuk integrasi yang digunakan.

- Jangan mengasumsikan payload selalu JSON.
- Jangan mempercayai status yang tidak diverifikasi.
- Validasi signature dan secret server.
- Cocokkan merchant, merchant order reference, nominal, dan referensi transaksi.
- Tangani event duplikat secara idempoten.
- Jangan mengungkapkan data internal dalam respons.
- Respons harus mengikuti protokol callback resmi.

Callback tidak menggunakan autentikasi pengguna sebagai satu-satunya kontrol. Jika endpoint harus menerima request tanpa JWT, validasi provider wajib dilakukan di handler.

## 5. Check payment status

Endpoint pembacaan status harus memeriksa hak akses pemohon, tidak menerima status pembayaran sebagai input tepercaya, tidak memperbarui status hanya karena frontend meminta status, mengembalikan data minimum, dan tidak membocorkan data pelanggan lain.

Contoh respons konseptual:

~~~json
{
  "order_id": "ORDER_ID",
  "order_status": "pending",
  "payment_status": "pending"
}
~~~

Status dalam contoh bukan enum final. Gunakan nilai yang telah ditetapkan pada skema dan aturan transisi aktual.

## 6. Format error

Format respons error yang diusulkan:

~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Permintaan tidak dapat diproses."
  }
}
~~~

Hindari mengembalikan stack trace, API key, signature rahasia, raw authorization header, atau payload pelanggan yang tidak diperlukan.

## 7. Versi dan kompatibilitas

- Perubahan field respons harus mempertimbangkan pemanggil frontend.
- Kontrak tidak boleh diubah tanpa audit pemanggil.
- Setiap perubahan perlu memiliki tes kontrak atau tes regresi.
- Nama endpoint dan field yang belum diverifikasi harus tetap ditandai PROPOSED.

## 8. Kriteria penerimaan

- Setiap endpoint aktual memiliki method, auth, input, output, dan error yang terdokumentasi.
- Semua pemanggil frontend yang relevan telah dipetakan.
- Callback menggunakan kontrak resmi provider.
- Tidak ada secret atau data sensitif dalam respons.
- Pengujian positif dan negatif tercatat.
