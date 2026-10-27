# 🃏 UNO Online Web (Klasik, Flip & No Mercy)

Website game UNO lengkap yang mendukung mode **Singleplayer (Versus A.I.)** dan **Multiplayer Room** untuk bermain bersama teman secara real-time.

---

## 🌟 Fitur Utama & Mode Game

### 1. Tiga Mode Permainan Lengkap
* **UNO Klasik**:
  * 108 kartu resmi (Merah, Kuning, Hijau, Biru).
  * Angka 0–9, Skip, Reverse, Draw Two (+2), Wild, dan Wild Draw Four (+4).
  * Tombol **UNO!** wajib ditekan saat sisa 1 kartu, atau pemain lain bisa menantangmu!
* **UNO Flip**:
  * Menggunakan kartu **dua sisi**: **Light Side** & **Dark Side**.
  * **Light Side**: Warna standar + Draw 1, Skip, Reverse, Wild, Wild Draw 2, dan kartu **Flip**.
  * **Dark Side**: Warna Pink, Teal, Orange, Purple + **Draw 5 (+5)**, **Skip Everyone**, **Wild Draw Color** (ambil kartu sampai dapat warna yang dipilih), dan kartu **Flip**.
  * Animasi 3D membalik seluruh tumpukan meja dan kartu tangan saat kartu Flip dimainkan!
* **UNO Show 'Em No Mercy**:
  * 168 kartu brutal dengan penalti berat: **+6**, **+10**, dan Wild Reverse Draw 4.
  * **Fitur Stacking**: Tumpuk kartu penalti (+2, +4, +6, +10) yang setara atau lebih tinggi.
  * **Kartu 0 & 7**: Angka 0 memutar seluruh kartu pemain searah putaran, angka 7 menukar seluruh kartu dengan lawan pilihanmu.
  * **Discard All**: Buang semua kartu yang warnanya sama sekaligus.
  * **Color Roulette**: Korban harus mengambil kartu dari deck sampai menemukan warna yang ditentukan.
  * **Mercy Rule**: Pemain yang memegang **25 kartu atau lebih** langsung **gugur (Knocked Out)**!

---

## 🎮 Cara Menjalankan & Memainkan

### 1. Menjalankan Server
Buka terminal / PowerShell di direktori `d:\xampp\htdocs\Uno`:
```bash
node server.js
```
Server akan aktif di: **`http://localhost:3000`**

### 2. Cara Main vs A.I. (Solo)
1. Buka browser ke [http://localhost:3000](http://localhost:3000).
2. Masukkan nama Anda dan pilih mode yang diinginkan (Klasik / Flip / No Mercy).
3. Klik tombol **"🤖 Main Langsung vs A.I."**.
4. Game akan langsung dimulai bersama 3 Bot pintar!

### 3. Cara Mabar Bersama Teman (Multiplayer Room)
1. Klik tombol **"👥 Buat Room Mabar Teman"**.
2. Salin **Kode Room** yang muncul (contoh: `A8B2C`) dan bagikan ke teman Anda.
3. Teman Anda membuka [http://localhost:3000](http://localhost:3000) (atau IP lokal Anda jika di satu jaringan Wi-Fi, contoh: `http://192.168.1.x:3000`), masukkan nama dan kode room pada kolom **"Gabung Room Teman"**.
4. Host dapat menambahkan Bot jika pemain kurang dan menekan tombol **"🚀 Mulai Permainan Sekarang!"**.
