# LuxDrive Travel — Website Documentation

<div align="center">

```
🚗  LuxDrive Travel
Perjalanan Mewah, Kenangan Tak Terlupakan
```

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](.)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](.)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](.)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](.)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](.)

</div>

---

## 📋 Overview

**LuxDrive Travel** adalah website travel mobil premium full-stack yang menyediakan layanan wisata ke berbagai destinasi terbaik Indonesia. Dibangun dengan desain mewah, elegan, dan responsif.

---

## 🗂️ Struktur Direktori

```
d:\web travel\
├── src\
│   ├── index.html          ← Halaman utama
│   ├── order.html          ← Halaman pemesanan
│   └── tentang kami.html   ← Halaman tentang kami
├── assets\
│   ├── css\
│   │   └── style.css       ← Global stylesheet
│   ├── js\
│   │   ├── main.js         ← Navbar, counter, scroll reveal
│   │   ├── order.js        ← Form, validasi, harga, WA redirect
│   │   └── security.js     ← Sanitasi, rate limit, validators
│   └── images\             ← (placeholder untuk gambar)
├── backend\
│   ├── server.js           ← Express server
│   ├── package.json
│   ├── .env.example        ← Template env variables
│   └── routes\
│       ├── order.js        ← POST /api/order
│       └── whatsapp.js     ← POST /api/whatsapp/generate-url
└── README.md
```

---

## 🎨 Desain & Teknologi

| Aspek | Detail |
|-------|--------|
| **Tema warna** | Dark Navy `#1a1a2e` · Scarlet `#e94560` · Gold `#f5a623` |
| **Font** | Montserrat (heading) · Poppins (body) via Google Fonts |
| **Icons** | Font Awesome 6 CDN |
| **Animasi** | CSS murni: fadeIn, slideUp, counter, scroll-reveal (IntersectionObserver) |
| **Responsive** | Mobile-first, breakpoints 480px / 768px / 1024px |
| **Backend** | Node.js · Express · Helmet · CORS · express-rate-limit |

---

## ✨ Fitur Utama

### Frontend
- ✅ Navbar sticky dengan scroll effect & mobile hamburger
- ✅ Hero section full-screen dengan animated gradient + pattern
- ✅ Stats counter animasi (IntersectionObserver)
- ✅ 6 card destinasi dengan CSS gradient placeholders
- ✅ 3 card armada kendaraan
- ✅ Section Why Choose Us, Testimonial, CTA
- ✅ Halaman Order dengan form lengkap + kalkulasi harga otomatis
- ✅ Upload bukti transfer dengan drag-and-drop preview
- ✅ WhatsApp redirect dengan pesan terformat lengkap
- ✅ Modal konfirmasi setelah submit
- ✅ Rate limiting client-side (3 submit / 10 menit via localStorage)
- ✅ Input sanitization (XSS prevention)
- ✅ Toast notifications
- ✅ Copy nomor rekening ke clipboard
- ✅ Halaman Tentang Kami: cerita, tim, nilai, galeri, kontak

### Backend
- ✅ Express server dengan Helmet security headers
- ✅ CORS yang dikonfigurasi
- ✅ Rate limiting: 3 order / 10 menit per IP
- ✅ Validasi server-side dengan express-validator
- ✅ Morgan logging
- ✅ Health check endpoint

---

## 🚀 Cara Menjalankan

### Frontend (tanpa backend)
Cukup buka file HTML langsung di browser, atau gunakan Live Server extension di VS Code:

```
Klik kanan src/index.html → Open with Live Server
```

### Backend (opsional, untuk validasi tambahan)

```bash
# 1. Masuk ke folder backend
cd "d:\web travel\backend"

# 2. Install dependencies
npm install

# 3. Buat file .env dari template
copy .env.example .env

# 4. Jalankan server
npm start
# atau development mode dengan auto-reload:
npm run dev
```

Server berjalan di: `http://localhost:3000`
Health check: `http://localhost:3000/api/health`

---

## 📱 Nomor WhatsApp

Semua pesanan dikirim ke: **0895-6294-66956**  
Format wa.me: `https://wa.me/6285629466956`

---

## 💰 Daftar Harga Destinasi

| Destinasi | Harga | Durasi |
|-----------|-------|--------|
| 🏖️ Bali | Rp 2.500.000 | 3 hari |
| 🏛️ Yogyakarta | Rp 1.800.000 | 2 hari |
| 🌋 Bromo | Rp 1.500.000 | 2 hari |
| 🤿 Raja Ampat | Rp 4.500.000 | 5 hari |
| 🦎 Labuan Bajo | Rp 3.500.000 | 4 hari |
| 🌴 Lombok | Rp 2.000.000 | 3 hari |

## 🚗 Daftar Armada

| Armada | Kapasitas | Biaya/Hari |
|--------|-----------|------------|
| Toyota Alphard (Premium) | 6 pax | Rp 350.000 |
| Hiace Commuter (Group) | 14 pax | Rp 500.000 |
| Toyota Fortuner (Adventure) | 7 pax | Rp 400.000 |

---

## 🔐 Keamanan

- **XSS Prevention**: semua input disanitasi (strip HTML tags) sebelum diproses
- **Rate Limiting**: client-side (localStorage) + server-side (express-rate-limit)
- **Input Validation**: validasi format di client + server (express-validator)
- **CORS**: hanya origin yang diizinkan bisa akses API
- **Helmet**: security headers (CSP, X-Frame-Options, dsb.)
- **File Upload**: validasi tipe (jpg/png/webp) & ukuran (maks 5MB) di client

---

## 📞 Kontak

| Channel | Info |
|---------|------|
| WhatsApp | 0895-6294-66956 |
| Email | info@luxdrivetravel.id |
| Alamat | Jl. Raya Wisata No. 88, Jakarta Selatan |
| Jam Operasional | Senin–Minggu, 08.00–22.00 WIB |

---

© 2024 **LuxDrive Travel** — Dibuat dengan ❤️ untuk wisatawan Indonesia
