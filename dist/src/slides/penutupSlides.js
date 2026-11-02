/**
 * Bab Penutup: perbandingan mekanisme, kesimpulan (angka dihitung langsung), dan pustaka.
 */

import { runExperiment, summarizeExperiment } from '../algorithms/cloudScheduling.js';
import { CH } from './chapters.js';

let cachedSummary = null;
function liveSummary() {
  if (!cachedSummary) cachedSummary = summarizeExperiment(runExperiment({ n: 16, m: 4, workloads: 10 }));
  return cachedSummary;
}

/* ---------- Ringkasan mekanisme ---------- */

const ROWS = [
  ['Inspirasi', 'Kunang-kunang yang berkedip', 'Kelelawar yang berekolokasi'],
  ['Siapa memandu gerak', 'Semua yang lebih terang', 'Satu yang terbaik, x*'],
  ['Pengatur jelajah', 'γ (peredam jarak), α (langkah acak)', 'A (kenyaringan), r (laju pulsa)'],
  ['Menuju akhir', 'α menyusut tiap iterasi', 'A turun tiap penerimaan'],
  ['Perbandingan per iterasi', 'N × N pasangan', 'N, hanya ke x*'],
  ['Evaluasi per iterasi', 'N', 'N (sama)']
];

const ringkasSlide = {
  id: 'ringkas',
  chapter: CH.penutup,
  title: 'Ringkasan: dua cara berpikir',
  notes: `
    <p>Satu kalimat per baris.</p>
    <ul>
      <li><b>Memandu gerak.</b> Firefly: tiap individu mengincar semua yang lebih baik, tarikan memudar dengan jarak, sehingga bisa terbentuk beberapa kelompok. Bat: semua mengincar satu pemimpin, x*, sehingga cenderung satu kelompok.</li>
      <li><b>Biaya.</b> Firefly membandingkan semua pasangan (N kali N) per iterasi, jadi lebih mahal bila populasi besar. Bat cukup N. Jumlah evaluasi fungsi tujuan sama, yang biasanya jadi komponen mahal bila fungsinya berat.</li>
      <li><b>Parameter.</b> Firefly: β₀, γ, α. Bat: f, A₀, r₀, α_A, γ_r. Bat memiliki lebih banyak knob, sehingga lebih repot dituning.</li>
    </ul>
    <p>Baris terakhir adalah angka hidup yang dihitung langsung di browser dari sepuluh beban kerja (16 tugas, 4 VM). Nilai bisa sedikit berbeda dengan tampilan eksperimen bila pengaturannya diubah.</p>`,
  mount(container) {
    container.innerHTML = `
      <div class="duo">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>10 · Kesimpulan</span>
          <h1 class="plate-title">Dua cara berpikir</h1>
        </header>
        <div class="duo-names"><span class="duo-fa">Firefly</span><span class="duo-ba">Bat</span></div>
        <div class="duo-rows">
          ${ROWS.map(
            (row, i) => `
            <div class="duo-row" style="--i:${i}">
              <em>${row[0]}</em>
              <p class="duo-cell duo-fa">${row[1]}</p>
              <p class="duo-cell duo-ba">${row[2]}</p>
            </div>`
          ).join('')}
          <div class="duo-row duo-live" style="--i:${ROWS.length}">
            <em>Rata-rata makespan ÷ batas bawah (10 beban kerja, 16 tugas, 4 VM)</em>
            <p class="duo-cell duo-fa" id="live-fa">…</p>
            <p class="duo-cell duo-ba" id="live-ba">…</p>
          </div>
        </div>
      </div>`;
    const timer = setTimeout(() => {
      const sum = liveSummary();
      const fa = container.querySelector('#live-fa');
      const ba = container.querySelector('#live-ba');
      if (fa) fa.textContent = `${sum.ratio.fa.toFixed(3)}×`;
      if (ba) ba.textContent = `${sum.ratio.ba.toFixed(3)}×`;
    }, 650);
    return () => clearTimeout(timer);
  }
};

/* ---------- Kesimpulan ---------- */

function conclusionLines(sum) {
  const diff = Math.abs(sum.ratio.fa - sum.ratio.ba) / Math.min(sum.ratio.fa, sum.ratio.ba);
  const lead = sum.ratio.fa < sum.ratio.ba ? 'Firefly' : 'Bat';
  return [
    {
      big: `${sum.gainFaVsRR.toFixed(0)}% dan ${sum.gainBaVsRR.toFixed(0)}%`,
      text: 'lebih cepat dari Round-Robin. Firefly dan Bat sama-sama jauh lebih baik daripada membagi bergiliran.'
    },
    {
      big: `${sum.ratio.fa.toFixed(2)}× vs ${sum.ratio.ba.toFixed(2)}×`,
      text:
        diff < 0.01
          ? 'dari batas bawah ideal. Selisih keduanya di bawah 1%, jadi tidak ada pemenang yang meyakinkan.'
          : `dari batas bawah ideal. ${lead} sedikit lebih rapat (selisih ${(diff * 100).toFixed(1)}%), dengan kemenangan Firefly ${sum.faWins} dan Bat ${sum.baWins} dari ${sum.count} beban kerja.`
    },
    {
      big: 'Pilih sesuai konteks',
      text: 'Firefly lebih mahal per iterasi karena membandingkan semua pasangan. Bat lebih ringan tetapi punya lebih banyak parameter. Keduanya bergantung pada pengaturan parameter.'
    }
  ];
}

const penutupSlide = {
  id: 'penutup',
  chapter: CH.penutup,
  title: 'Kesimpulan',
  notes: `
    <p>Tiga pesan, angkanya dihitung langsung saat slide dibuka.</p>
    <ol>
      <li>Metaheuristik terbukti berguna: jauh di bawah Round-Robin.</li>
      <li>Antara Firefly dan Bat, selisihnya kecil dan bergantung beban kerja. Jangan klaim satu pasti unggul.</li>
      <li>Pemilihan bergantung konteks: ukuran populasi, biaya evaluasi, dan waktu untuk menala parameter.</li>
    </ol>
    <p><b>Batasan yang perlu disebut jujur:</b> tugas diasumsikan independen, VM heterogen tetap, tanpa antrean atau biaya komunikasi. Decoding memakai pembulatan, bukan SPV seperti paper Firefly. Sepuluh beban kerja bukan uji statistik. Satu-satunya metrik adalah makespan. Penelitian lanjutan: workflow dengan dependensi, biaya, dan energi (seperti yang dibahas paper Bat), serta uji signifikansi.</p>`,
  mount(container) {
    container.innerHTML = `
      <div class="closing">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>10 · Kesimpulan</span>
          <h1 class="plate-title">Dua pencari dari alam, satu masalah cloud</h1>
        </header>
        <div class="verdicts" id="finale-grid"><p class="verdict-wait">Menghitung …</p></div>
        <p class="limits"><b>Batasan.</b> Tugas independen, VM tetap, tanpa antrean dan biaya komunikasi. Decoding memakai pembulatan (paper Firefly memakai SPV). Sepuluh beban kerja bukan uji statistik. Metrik tunggal: makespan.</p>
      </div>`;
    const timer = setTimeout(() => {
      const grid = container.querySelector('#finale-grid');
      if (!grid) return;
      grid.innerHTML = conclusionLines(liveSummary())
        .map((c, i) => `<article class="verdict" style="--i:${i}"><span>${i + 1}</span><strong>${c.big}</strong><p>${c.text}</p></article>`)
        .join('');
    }, 80);
    return () => clearTimeout(timer);
  }
};

/* ---------- Pustaka ---------- */

const REFS = [
  {
    badge: 'ref-badge-fa',
    tag: 'Firefly (aplikasi)',
    year: '2011',
    title: 'Scheduling jobs on grid computing using Firefly Algorithm',
    cite: 'Yousif, A., Abdullah, A. H., Nor, S. M., &amp; Abdelaziz, A. A. <em>Journal of Theoretical and Applied Information Technology</em>, 33(2). jatit.org/volumes/Vol33No2/3Vol33No2.pdf',
    impl: '<strong>Dipakai untuk:</strong> penerapan FA pada penjadwalan job (aturan SPV, pembanding Min-Min dan Max-Min). Penelitian pada <em>grid</em>, bukan cloud.'
  },
  {
    badge: 'ref-badge-ba',
    tag: 'Bat (aplikasi)',
    year: '2015',
    title: 'Bat algorithm for scheduling workflow applications in cloud',
    cite: 'Raghavan, S., Sarwesh, P., Marimuthu, C., &amp; Chandrasekaran, K. <em>2015 Int. Conf. on Electronic Design, Computer Networks &amp; Automated Verification (EDCAV)</em>, 139–144. ieeexplore.ieee.org/document/7060555',
    impl: '<strong>Dipakai untuk:</strong> konteks BA pada workflow cloud. <strong>Catatan:</strong> hanya abstrak dan metadata yang diverifikasi saat menyusun deck ini. Baca teks lengkap sebelum mengutip hasilnya.'
  },
  {
    badge: 'ref-badge-fa',
    tag: 'Firefly (asal)',
    year: '2009',
    title: 'Firefly algorithms for multimodal optimization',
    cite: 'Yang, X.-S. <em>Stochastic Algorithms: Foundations and Applications (SAGA 2009)</em>, LNCS 5792, 169–178. Springer.',
    impl: '<strong>Dipakai untuk:</strong> kecerahan, daya tarik β₀e^(−γr²), dan aturan gerak. Periksa halaman dan penerbit sebelum masuk daftar pustaka laporan.'
  },
  {
    badge: 'ref-badge-ba',
    tag: 'Bat (asal)',
    year: '2010',
    title: 'A new metaheuristic bat-inspired algorithm',
    cite: 'Yang, X.-S. <em>Nature Inspired Cooperative Strategies for Optimization (NICSO 2010)</em>, SCI 284, 65–74. Springer.',
    impl: '<strong>Dipakai untuk:</strong> frekuensi, kecepatan, kenyaringan A, dan laju pulsa r. Tanda kecepatan di deck ini dibalik agar menuju x*; cek ke sumber asli.'
  },
  {
    badge: 'ref-badge-bench',
    tag: 'Pembanding',
    year: '2001',
    title: 'A comparison of eleven static heuristics for mapping a class of independent tasks onto heterogeneous distributed computing systems',
    cite: 'Braun, T. D., et al. <em>Journal of Parallel and Distributed Computing</em>, 61(6), 810–837.',
    impl: '<strong>Dipakai untuk:</strong> definisi Min-Min sebagai pembanding klasik. Periksa daftar penulis lengkap sebelum mengutip.'
  },
  {
    badge: 'ref-badge-cloud',
    tag: 'Model & kode',
    year: '2026',
    title: 'Simulator makespan pada VM heterogen',
    cite: 'Dibuat untuk presentasi ini. Tugas independen, waktu = MI ÷ MIPS, makespan = beban VM terbesar. Kode sumber terbuka di folder <em>src/algorithms</em>.',
    impl: '<strong>Penting:</strong> angka yang tampil adalah hasil simulasi ini, bukan angka dari paper di atas.'
  }
];

const pustakaSlide = {
  id: 'pustaka',
  chapter: CH.penutup,
  title: 'Sumber dan pustaka',
  notes: `
    <p>Daftar sumber dan status verifikasinya. Dua paper utama: Yousif dkk. (2011) untuk Firefly dan Raghavan dkk. (2015) untuk Bat.</p>
    <p>Jujur soal batas verifikasi: paper Firefly dibaca penuh (rumus, aturan SPV, tabel contoh). Paper Bat hanya abstrak dan metadata yang dapat diakses saat menyusun, sehingga angka hasilnya tidak ditampilkan. Lengkapi dari PDF melalui akses kampus.</p>
    <p>Sitasi Yang (2009), Yang (2010), dan Braun dkk. (2001) ditulis dari ingatan bibliografi umum: cek ulang halaman, penerbit, dan daftar penulis sebelum dimasukkan ke laporan.</p>`,
  mount(container) {
    container.innerHTML = `
      <div class="shelf">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>Sumber</span>
          <h1 class="plate-title">Pustaka dan status verifikasi</h1>
        </header>
        <div class="shelf-grid">
          ${REFS.map(
            (r, i) => `
            <article class="book" style="--i:${i}">
              <div class="book-top"><span class="book-tag ${r.badge}">${r.tag}</span><span class="book-year">${r.year}</span></div>
              <h2>${r.title}</h2>
              <p class="book-cite">${r.cite}</p>
              <p class="book-use">${r.impl}</p>
            </article>`
          ).join('')}
        </div>
      </div>`;
  }
};

export const penutupSlides = [ringkasSlide, penutupSlide, pustakaSlide];
