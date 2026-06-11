# WarungAI — AI Business Assistant for UMKM

WarungAI adalah aplikasi berbasis Artificial Intelligence yang membantu pelaku UMKM mencatat transaksi, menganalisis performa bisnis, membuat strategi pemasaran, dan menghasilkan konten promosi secara otomatis berdasarkan data penjualan.

## Problem Statement

Banyak pelaku UMKM masih mencatat penjualan secara manual dan kesulitan memahami performa bisnisnya. Akibatnya, pemilik usaha sering tidak mengetahui produk terlaris, produk kurang laku, kondisi kesehatan bisnis, dan strategi promosi yang tepat.

WarungAI hadir sebagai solusi digital untuk membantu UMKM mengambil keputusan bisnis berbasis data dengan bantuan Generative AI.

## Fitur Utama

* Dashboard bisnis real-time
* Pencatatan transaksi penjualan
* Integrasi database Supabase
* Health Score bisnis otomatis
* Analisis bisnis berbasis AI
* Prediksi omzet AI
* AI Action Plan 7 Hari
* AI Content Generator berbasis produk terlaris
* Mentor AI untuk konsultasi bisnis UMKM
* Profil usaha tersimpan di Supabase

## Teknologi yang Digunakan

* React
* TypeScript
* Vite
* TanStack Router
* Tailwind CSS
* Supabase
* Google Gemini API
* Lucide React Icons

## Alur Penggunaan

1. Pengguna mengisi profil usaha.
2. Pengguna mencatat transaksi penjualan.
3. Data tersimpan di Supabase.
4. Dashboard menampilkan omzet, transaksi, produk terlaris, dan health score.
5. AI menganalisis data penjualan.
6. AI memberikan insight, prediksi omzet, action plan, dan konten promosi.
7. Mentor AI membantu pengguna menentukan strategi bisnis.

## Arsitektur Aplikasi

Frontend React terhubung dengan Supabase sebagai database utama. Data transaksi dan profil usaha digunakan oleh fitur dashboard, analisis bisnis, AI content generator, dan mentor AI. Google Gemini API digunakan untuk menghasilkan analisis, rekomendasi, dan konten promosi.

## Dampak untuk UMKM

WarungAI membantu UMKM:

* Mengambil keputusan berbasis data
* Mengetahui produk terlaris dan produk kurang laku
* Membuat promosi lebih cepat
* Menyusun strategi bisnis mingguan
* Menghemat waktu dalam membuat konten pemasaran

## Rencana Pengembangan

* Login multi-user
* Row Level Security per pengguna
* Integrasi WhatsApp Business
* Laporan PDF otomatis
* Manajemen stok
* Analisis loyalitas pelanggan
* Forecasting penjualan lanjutan
