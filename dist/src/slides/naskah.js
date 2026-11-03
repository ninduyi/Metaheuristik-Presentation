/**
 * Naskah narasi untuk presenter. Satu entri per slide, satu kalimat-paragraf per beat
 * (jumlah paragraf harus sama dengan jumlah beat slide; ada tesnya).
 * Bahasa dibuat enak diucapkan. Silakan ubah sesuai gaya bicara kamu sendiri.
 */

export const NASKAH = {
  judul: [
    'Selamat pagi rekan-rekan dan Bapak Ibu dosen. Pada presentasi kali ini, kami akan membedah strategi optimasi komputasi awan melalui komparasi dua metaheuristik berbasis alam, yaitu Firefly Algorithm dan Bat Algorithm, untuk memecahkan persoalan penjadwalan tugas komputasi awan. Melalui visualisasi interaktif dan simulasi komparatif langsung, kita akan menelaah bagaimana kedua algoritma ini bekerja, bagaimana perilakunya menyeimbangkan eksplorasi dan eksploitasi, serta efektivitasnya dalam meminimalkan waktu penyelesaian atau makespan.'
  ],
  masalah: [
    'Latar belakang masalah berakar dari alokasi sumber daya di pusat data komputasi awan. Kita menghadapi enam belas tugas dengan beban instruksi berbeda, yang harus dialokasikan ke empat mesin virtual heterogen dengan kapasitas 85 hingga 175 MIPS. Waktu pemrosesan setiap tugas berbanding lurus dengan panjang instruksi dibagi kecepatan mesin virtual tujuan, sehingga keputusan penempatan tugas menjadi penentu utama efisiensi komputasi.',
    'Pendekatan konvensional seperti Round-Robin membagi tugas secara merata bergiliran. Meski terkesan adil dari kuantitas tugas, strategi ini mengabaikan heterogenitas kecepatan mesin, sehingga mesin terlambat menyelesaikan beban paling lama. Waktu selesai mesin paling lambat inilah yang kita definisikan sebagai makespan. Pada simulasi ini, makespan Round-Robin terpaut jauh sekitar 51 persen di atas batas bawah ideal, yang ditunjukkan oleh garis hijau.',
    'Mencari jadwal optimal dengan memeriksa seluruh kemungkinan kombinasi secara brute force terbukti mustahil karena terjadi ledakan kombinatorial. Setiap penambahan tugas melipatgandakan ruang solusi empat kali lipat, sehingga enam belas tugas menghasilkan lebih dari 4,29 miliar kombinasi jadwal. Jika satu jadwal dievaluasi dalam satu milidetik, penelusuran menyeluruh memakan waktu hampir lima puluh hari nonstop. Inilah alasan mengapa kita memerlukan algoritma metaheuristik cerdas yang mampu menemukan solusi mendekati optimal secara efisien.'
  ],
  lanskap: [
    'Sekarang bayangkan setiap jadwal sebagai satu titik di pegunungan, dan tingginya adalah waktu selesai. Pencari tunggal yang hanya mau turun akan berhenti di lembah terdekat. Itu yang disebut optimum lokal, sementara lembah yang lebih dalam tidak pernah ia lihat.',
    'Metaheuristik memakai banyak pencari sekaligus dan membuat mereka saling memberi kabar. Satu pencari yang beruntung menemukan lembah yang dalam, lalu yang lain ikut bergerak ke sana.',
    'Kuncinya ada di keseimbangan. Di awal kita menjelajah seluas mungkin supaya tidak terjebak, dan di akhir kita menelusuri dengan teliti supaya hasilnya rapi. Firefly dan Bat mengatur keseimbangan ini dengan cara yang berbeda, dan itulah inti perbandingan kita hari ini.'
  ],
  'fa-inspirasi': [
    'Firefly Algorithm terinspirasi dari kunang-kunang yang berkedip untuk saling memanggil. Di algoritma ini, satu kunang-kunang mewakili satu kandidat jadwal.',
    'Terang redupnya cahaya mewakili kualitas solusi. Semakin bagus jadwalnya, semakin terang kunang-kunangnya. Jadi kecerahan di sini bukan sekadar hiasan.',
    'Aturan mainnya, yang redup terbang mengejar yang lebih terang. Semakin jauh jaraknya, semakin lemah tarikannya, sama seperti cahaya yang memudar di kejauhan.'
  ],
  'fa-karakter': [
    'Slide ini menjelaskan tiga parameter utama yang mengendalikan seluruh perilaku Firefly Algorithm, yaitu beta nol, gamma, dan alpha. Pemahaman ketiga parameter ini sangat penting karena keseimbangan antara penjelajahan ruang baru dan pematangan solusi lokal sepenuhnya ditentukan di sini. Beta nol mengatur daya tarik dasar ketika dua individu berdekatan. Gamma mengatur seberapa cepat daya tarik melemah oleh jarak, sehingga menentukan apakah kunang-kunang akan menyatu dalam satu kelompok besar atau terpecah menjadi banyak kelompok lokal untuk menangani banyak lembah. Terakhir, alpha memberikan langkah acak agar individu tidak mandek dan tetap menjelajah. Ketiga parameter inilah motor penggerak Firefly sebelum kita bawa ke penjadwalan komputasi awan.'
  ],
  'fa-cara': [
    'Langkah pertama, setiap kunang-kunang dihitung nilai fungsi tujuannya. Pada kasus kita nilainya makespan, dan makin kecil berarti makin terang.',
    'Langkah kedua, setiap kunang-kunang yang redup melihat semua yang lebih terang darinya, lalu mengincar mereka sekaligus.',
    'Langkah ketiga, tarikan melemah karena jarak. Tebal garis di layar menunjukkan kuat tarikan beta. Yang dekat menarik kuat, yang jauh hanya samar.',
    'Langkah terakhir, kunang-kunang terbang mengikuti tarikan lalu bergoyang sedikit secara acak. Tarikan memberi arah, sedangkan langkah acak menjaga agar pencarian tetap menjelajah.'
  ],
  'fa-sim': [
    'Sekarang kita coba langsung. Tombol Mulai menjalankan animasi, Langkah maju satu tahap, dan Reset mengulang dari awal. Di kanan ada nilai terbaik dan grafik konvergensi. Saya bisa mengganti fungsi uji di dock bawah, dan membuka laci Parameter untuk mengubah parameter algoritma, jumlah populasi, kecepatan, sampai seed acaknya.'
  ],
  'ba-inspirasi': [
    'Bat Algorithm terinspirasi dari kelelawar yang berekolokasi. Kelelawar bersuara, lalu mendengar gemanya, dan dari gema itu ia tahu seberapa jauh mangsanya.',
    'Saat mendekati mangsa, kelelawar mengirim pulsa lebih sering tapi dengan suara yang lebih pelan. Di algoritma, laju pulsa r naik dan kenyaringan A turun.',
    'Satu kelelawar terbaik menjadi arah tujuan. Yang lain terbang menuju dia, lalu sesekali menjelajah di sekitarnya.'
  ],
  'ba-karakter': [
    'Di Bat ada dua nilai yang berubah seiring waktu. Kenyaringan A turun dan laju pulsa r naik. Ada empat tombol pengatur, yaitu A nol, r nol, alpha A, dan gamma r. Saya geser slider-nya, dan perhatikan bentuk kurva serta lingkaran gema di sebelah kanan.'
  ],
  'ba-cara': [
    'Pertama, setiap kelelawar terbang menuju yang terbaik. Frekuensi acak f menentukan seberapa jauh ia melangkah.',
    'Kedua, kadang kelelawar menjelajah dekat x bintang. Kalau angka acak lebih besar dari r, titik percobaan diganti titik acak di sekitar kelelawar terbaik.',
    'Ketiga, hanya yang lolos yang berpindah. Titik baru harus lebih baik dan lolos peluang yang ditentukan kenyaringan A. Kalau diterima, A turun dan r naik.'
  ],
  'ba-sim': [
    'Kontrolnya sama dengan Firefly supaya mudah dibandingkan. Tanda centang menandai titik percobaan yang diterima dan tanda silang menandai yang ditolak. Perhatikan bagaimana kelelawar cenderung berkumpul ke satu titik terbaik.'
  ],
  'model-fitness': [
    'Sekarang model matematikanya. Satu posisi kandidat hanyalah satu daftar angka, satu angka untuk tiap tugas.',
    'Angka itu dibulatkan ke bawah lalu ditambah satu, hasilnya nomor VM. Geser sedikit saja angkanya dan satu tugas bisa pindah mesin.',
    'Selanjutnya tiap VM menjumlahkan waktu kerja semua tugas yang diterimanya. Waktu satu tugas adalah panjang tugas dibagi kecepatan VM.',
    'Yang paling terlambat menentukan nilai. Makespan adalah waktu selesai VM yang paling lama bekerja, dan makespan kecil berarti jadwal bagus. Di program ini ditambahkan suku yang sangat kecil dari sebaran beban, hanya sebagai pemecah seri.'
  ],
  'model-persamaan': [
    'Sekarang persamaannya terasa masuk akal karena kita sudah melihat gambarnya. Kita mulai dari jarak antar kunang-kunang, yang dinormalkan ke rentang nol sampai satu supaya nilai gamma bermakna sama di peta dua dimensi maupun di jadwal enam belas tugas.',
    'Daya tarik Firefly adalah beta nol dikali e pangkat minus gamma r kuadrat. Makin jauh makin lemah. Di Bat, frekuensi diambil acak di antara f minimum dan f maksimum.',
    'Aturan terbang Firefly menarik yang redup ke yang terang. Pada Bat, kecepatan diperbarui menuju x bintang. Perlu saya sampaikan dengan jujur, tanda kecepatan di sini dibalik dari tulisan Yang supaya kelelawar benar-benar menuju x bintang sesuai penjelasan verbalnya.',
    'Terakhir, Firefly menambahkan goyang acak alpha sebagai penjaga keragaman. Bat memakai seleksi, yaitu titik baru diterima hanya bila lebih baik dan lolos peluang A, lalu A turun dan r naik.'
  ],
  'kasus-kode': [
    'Sekarang kita masukkan ke kasus cloud. Alurnya, tugas masuk, penjadwal membuat banyak kandidat jadwal, tiap kandidat dihitung makespan-nya, lalu Firefly atau Bat menggeser kandidat, dan jadwal terbaik dikirim ke VM. Saya klik sebuah blok tugas untuk memindahkannya ke VM berikutnya dan makespan ikut berubah. Lalu saya tekan Hasil Firefly atau Hasil Bat untuk melihat jadwal yang ditemukan algoritma pada beban kerja yang sama.'
  ],
  'kasus-run': [
    'Di sini Firefly dan Bat menjadwalkan beban kerja yang sama persis, dengan populasi awal dan anggaran evaluasi yang sama. Jalur atas Firefly, jalur bawah Bat. Grafik di kanan membandingkan keduanya dengan Round-Robin, Min-Min, dan batas bawah ideal. Saya tekan Mulai, dan kita lihat blok-blok bergeser antar VM sementara makespan turun.'
  ],
  adu: [
    'Sekarang adu langsung di peta dua dimensi. Posisi awal kedua algoritma sama persis, jadi perbedaannya hanya datang dari aturan geraknya. Saya bisa ganti fungsi uji ke Rastrigin, Ackley, atau Sphere, dan mengubah seed untuk menunjukkan bahwa pemenangnya bisa berganti. Satu kali jalan belum cukup untuk menarik kesimpulan, makanya slide berikutnya memakai banyak beban kerja.'
  ],
  eksperimen: [
    'Di sini algoritma dijalankan pada sepuluh beban kerja berbeda, dan semuanya dihitung langsung di browser. Sumbu tegak adalah rasio terhadap batas bawah ideal, jadi satu kali berarti sempurna. Keduanya jauh lebih baik dari Round-Robin, tapi selisih Firefly dan Bat kecil dan berubah-ubah. Saya tekan Seed baru untuk menunjukkan hasilnya bisa bergeser. Karena itu saya tidak menyimpulkan satu algoritma selalu menang.'
  ],
  ringkas: [
    'Untuk meringkas, Firefly dipandu semua yang lebih terang sehingga bisa membentuk beberapa kelompok, sedangkan Bat dipandu satu pemimpin, yaitu x bintang. Firefly membandingkan semua pasangan sehingga lebih mahal saat populasi besar, sementara Bat lebih ringan tapi punya lebih banyak parameter. Jumlah evaluasi fungsi tujuan sama. Baris terakhir adalah angka hidup dari sepuluh beban kerja.'
  ],
  penutup: [
    'Ada tiga pesan penutup. Pertama, metaheuristik terbukti berguna karena hasilnya jauh di bawah Round-Robin. Kedua, antara Firefly dan Bat selisihnya kecil dan bergantung pada beban kerja, jadi jangan mengklaim satu pasti unggul. Ketiga, pilihan bergantung konteks, yaitu ukuran populasi, biaya evaluasi, dan waktu untuk menala parameter. Batasannya, tugas independen, VM tetap, tanpa antrean dan biaya komunikasi, dan sepuluh beban kerja belum merupakan uji statistik. Terima kasih.'
  ],
  pustaka: [
    'Ini daftar sumber. Paper Firefly dari Yousif dan kawan-kawan tahun 2011 membahas penjadwalan job di grid, sedangkan paper Bat dari Raghavan dan kawan-kawan tahun 2015 membahas workflow di cloud. Perlu saya sampaikan dengan jujur bahwa untuk paper Bat hanya abstraknya yang saya verifikasi, dan angka di aplikasi ini adalah hasil simulator sendiri, bukan angka dari paper. Terima kasih, saya buka sesi diskusi.'
  ]
};
