/**
 * StepTicker memisahkan dua irama yang berbeda:
 *   1. langkah algoritma (diskrit, dikendalikan tombol Mulai, Jeda, Langkah, Reset)
 *   2. gambar di layar (kontinu, tiap frame)
 * Di antara dua langkah, `glide` naik dari 0 ke 1 sehingga gambar bisa meluncur halus dari posisi lama ke baru.
 */

const smooth = (p) => 1 - (1 - p) ** 3;

export class StepTicker {
  /**
   * @param {object} o
   * @param {() => boolean} o.onTick   menjalankan satu langkah, mengembalikan true bila algoritma selesai
   * @param {(glide:number, nowMs:number) => void} o.onFrame  menggambar satu frame
   * @param {number} [o.rate]          langkah per detik saat berjalan
   * @param {boolean} [o.calm]         true bila pengguna meminta gerakan dikurangi
   */
  constructor({ onTick, onFrame, rate = 2.5, calm = false }) {
    this.onTick = onTick;
    this.onFrame = onFrame;
    this.calm = calm;
    this.running = false;
    this.onRunningChange = null;
    this.setRate(rate);
    this.frameId = 0;
    this.lastNow = 0;
    this.carry = 0;
    this.glideFrom = 0;
    this.glideMs = 1;
  }

  setRate(rate) {
    this.rate = Math.min(30, Math.max(0.3, Number(rate) || 2.5));
    this.glideLen = this.calm ? 1 : Math.min(520, Math.max(60, (1000 / this.rate) * 0.78));
    if (this.running) this.glideMs = this.glideLen;
  }

  #markTick(now, duration) {
    this.glideFrom = now;
    this.glideMs = duration;
  }

  #loop = (now) => {
    const gap = this.lastNow ? now - this.lastNow : 0;
    this.lastNow = now;

    if (this.running) {
      this.carry += gap;
      const every = 1000 / this.rate;
      if (this.carry >= every) {
        this.carry %= every;
        this.#markTick(now, this.glideLen);
        if (this.onTick()) this.halt();
      }
    }
    const progress = this.glideMs <= 2 ? 1 : Math.min(1, Math.max(0, (now - this.glideFrom) / this.glideMs));
    this.onFrame(smooth(progress), now);
    this.frameId = requestAnimationFrame(this.#loop);
  };

  /** Mulai menggambar (dan menjalankan langkah bila sedang berjalan). Aman dipanggil berulang. */
  attach() {
    if (!this.frameId) this.frameId = requestAnimationFrame(this.#loop);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.carry = 1e9; // langkah pertama langsung jalan
    this.onRunningChange?.(true);
    this.attach();
  }

  halt() {
    if (!this.running) return;
    this.running = false;
    this.onRunningChange?.(false);
  }

  toggle() {
    this.running ? this.halt() : this.start();
  }

  /** Satu langkah manual dengan peluncuran sedikit lebih panjang supaya gerakannya terlihat jelas. */
  single() {
    this.halt();
    this.#markTick(performance.now(), this.calm ? 1 : 420);
    this.onTick();
    this.attach();
  }

  /** Dipanggil setelah mesin dikembalikan ke awal: gambar langsung melompat tanpa meluncur. */
  settle() {
    this.halt();
    this.#markTick(performance.now(), 1);
    this.attach();
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }
}
