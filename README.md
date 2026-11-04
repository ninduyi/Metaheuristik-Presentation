# Firefly Algorithm vs Bat Algorithm: Cloud Task Scheduling

Website presentasi interaktif dan komparasi simulasi algoritma metaheuristik (**Firefly Algorithm** vs **Bat Algorithm**) untuk optimasi penjadwalan tugas komputasi awan (*Cloud Task Scheduling*).

Dibuat menggunakan HTML, CSS, dan JavaScript modern tanpa dependensi eksternal atau CDN (100% *offline-ready*).

---

## 🔗 Live Demo

Akses langsung presentasi interaktif melalui GitHub Pages:  
👉 **[https://ninduyi.github.io/Metaheuristik-Presentation/](https://ninduyi.github.io/Metaheuristik-Presentation/)**

---

## 📋 Isi Presentasi

Presentasi terdiri dari **8 Bab (20 Slide Interaktif)** dengan navigasi *spine* dan naskah presenter:

| Bab | Slide | Topik Bahasan |
| :--- | :--- | :--- |
| **1. Masalah** | `#judul`, `#masalah`, `#ruang-solusi` | Cover interaktif, tantangan penjadwalan heterogen (16 tugas, 4 VM), dan lanskap ruang solusi. |
| **2. Dasar** | `#metaheuristik-apa`, `#metaheuristik-tiga` | Konsep metaheuristik dan 3 tantangan utama optimasi (jebakan lokal optimum, eksplorasi vs eksploitasi). |
| **3. Firefly** | `#fa-intro`, `#fa-cara`, `#fa-karakter` | Konsep kilatan cahaya kunang-kunang, perumusan daya tarik $\beta(r)$, parameter penentu ($\beta_0, \gamma, \alpha$), dan simulasi interaktif 2D. |
| **4. Bat** | `#ba-intro`, `#ba-cara`, `#ba-sim` | Konsep biosonar ekolokasi, penyesuaian frekuensi, modulasi kenyaringan $A$ & laju pulsa $r$, serta simulasi 3D. |
| **5. Model** | `#model-fitness`, `#model-persamaan` | Pemetaan koordinat kontinu ke nomor VM diskrit (decoding floor), fungsi fitness makespan, dan komparasi matematis FA vs BA. |
| **6. Cloud** | `#kasus-kode`, `#kasus-run` | Alur kerja penjadwal di cloud, playground pemindahan tugas manual, dan eksekusi komparasi langsung pada beban kerja identik. |
| **7. Hasil** | `#adu`, `#eksperimen` | Head-to-head konvergensi real-time serta evaluasi komparatif pada 10 variasi beban kerja cloud. |
| **8. Penutup** | `#ringkas`, `#penutup`, `#pustaka` | Analisis keunggulan/kelemahan masing-masing algoritma, kesimpulan praktis, dan referensi akademik. |

---

## ⌨️ Pintasan Keyboard

* **`→` / `Spasi`**: Maju ke beat atau slide berikutnya
* **`←`**: Kembali ke beat atau slide sebelumnya
* **`1` – `8`**: Lompat cepat ke Bab 1 s.d. Bab 8
* **`T`**: Buka/tutup naskah narasi presenter (*Script Paper*)
* **`N`**: Buka/tutup catatan teknis presenter (*Presenter Notes*)
* **`G`**: Buka kisi seluruh slide (*Overview Grid*)
* **`P` / `S` / `R`**: Play, Step (langkah), atau Reset pada simulasi
* **`F`**: Mode layar penuh (*Fullscreen*)
* **`?`**: Bantuan daftar pintasan

---

## 📂 Struktur Proyek

```text
Metaheuristik-Presentation/
├── index.html               # Entry point utama presentasi
├── package.json             # Konfigurasi npm & skrip pengujian
├── dist/                    # Folder rilis siap hosting / deploy
├── public/                  # Aset publik statis
│   ├── app.bundle.js        # Bundel mandiri untuk mode file://
│   └── fonts/               # Font lokal (Sora, Manrope, Red Hat Mono)
├── src/
│   ├── algorithms/          # Logika murni metaheuristik (FA, BA, Cloud Scheduling)
│   ├── core/                # Generator angka acak (PRNG ber-seed), fungsi lanskap
│   ├── render/              # Engine kanvas 2D/3D, sprites, motion, heatmap, Gantt chart
│   ├── slides/              # Modul isi slide (Bab 1–8), frame cerita, dan naskah narasi
│   ├── styles/              # CSS desain modern 3D glassmorphic, tema warna & tata letak
│   └── ui/                  # Presenter shell, spine navigation, dock controls, script paper
├── scripts/                 # Utilitas server dev dan runner pengujian
└── tests/                   # 30 unit test & verifikasi otomatis
```

---

## 📚 Sumber & Referensi Literatur

1. **Firefly Algorithm:**
   * Yang, X.-S. (2009). *Firefly algorithms for multimodal optimization*. Stochastic Algorithms: Foundations and Applications (SAGA 2009), LNCS 5792, pp. 169–178.
   * Yousif, A., Abdullah, A. H., Nor, S. M., & Abdelaziz, A. A. (2011). *Scheduling jobs on grid computing using Firefly Algorithm*. Journal of Theoretical and Applied Information Technology (JATIT), 33(2).
2. **Bat Algorithm:**
   * Yang, X.-S. (2010). *A new metaheuristic bat-inspired algorithm*. Nature Inspired Cooperative Strategies for Optimization (NICSO 2010), SCI 284, pp. 65–74.
   * Raghavan, S., Sarwesh, P., Marimuthu, C., & Chandrasekaran, K. (2015). *Bat algorithm for scheduling workflow applications in cloud*. IEEE EDCAV 2015, pp. 139–144.
3. **Penjadwalan Komputasi Terdistribusi:**
   * Braun, T. D., et al. (2001). *A comparison of eleven static heuristics for mapping a class of independent tasks onto heterogeneous distributed computing systems*. Journal of Parallel and Distributed Computing, 61(6), pp. 810–837.
