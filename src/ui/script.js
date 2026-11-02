/**
 * Kertas naskah: lembar kertas krem di atas panggung yang menampilkan narasi slide aktif.
 * Paragraf untuk beat yang sedang tampil menyala, yang lain diredupkan, dan lembar ikut menggulir.
 * Fitur: geser lewat kepala kertas, ubah ukuran dari sudut kanan bawah, tombol huruf A- dan A+,
 * serta jendela terpisah untuk layar presenter (diisi dan disinkronkan dari jendela utama).
 */

const SIZE_KEY = 'fa_ba_deck_script_size_v1';
const SIZE_MIN = 20;
const SIZE_MAX = 56;

const ICON = {
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  popout: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
};

const markup = (solo) => `
  <header class="paper-head">
    <b>Naskah</b>
    <span class="paper-where"></span>
    <div class="paper-tools">
      <button type="button" data-act="smaller" title="Huruf lebih kecil" aria-label="Huruf lebih kecil">A−</button>
      <button type="button" data-act="bigger" title="Huruf lebih besar" aria-label="Huruf lebih besar">A+</button>
      ${solo ? '' : `<button type="button" data-act="popout" title="Buka di jendela terpisah" aria-label="Buka di jendela terpisah">${ICON.popout}</button>`}
      ${solo ? '' : `<button type="button" data-act="close" title="Tutup naskah (T)" aria-label="Tutup naskah">${ICON.close}</button>`}
    </div>
  </header>
  <div class="paper-body"></div>`;

export class ScriptPaper {
  /** @param {{getState:()=>{slide:object,index:number,total:number,beat:number}, scale:()=>number, goBeat:(d:number)=>void}} host */
  constructor(host) {
    this.host = host;
    this.root = document.getElementById('script-paper');
    this.size = this.#loadSize();
    this.popup = null;
    this.drag = null;

    this.root.innerHTML = markup(false);
    this.#wire(this.root, false);
    this.#enableDrag();
    this.setOpen(false);
  }

  #loadSize() {
    try {
      const n = Number(localStorage.getItem(SIZE_KEY));
      if (n >= SIZE_MIN && n <= SIZE_MAX) return n;
    } catch {
      /* penyimpanan bisa diblokir */
    }
    return 32;
  }

  #saveSize() {
    try {
      localStorage.setItem(SIZE_KEY, String(this.size));
    } catch {
      /* diabaikan */
    }
  }

  get isOpen() {
    return !this.root.classList.contains('hidden');
  }

  setOpen(open) {
    this.root.classList.toggle('hidden', !open);
    document.getElementById('btn-script')?.setAttribute('aria-pressed', String(open));
    if (open) this.update();
  }

  toggle() {
    this.setOpen(!this.isOpen);
  }

  #wire(root, solo) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'smaller' || act === 'bigger') {
        this.size = Math.min(SIZE_MAX, Math.max(SIZE_MIN, this.size + (act === 'bigger' ? 4 : -4)));
        this.#saveSize();
        this.update();
      } else if (act === 'close') this.setOpen(false);
      else if (act === 'popout') this.openWindow();
    });
    if (solo) return;
  }

  /** Menggeser kertas dengan menyeret kepalanya. Koordinat dihitung dalam satuan panggung. */
  #enableDrag() {
    const head = this.root.querySelector('.paper-head');
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const k = this.host.scale() || 1;
      this.drag = { x: e.clientX, y: e.clientY, left: this.root.offsetLeft, top: this.root.offsetTop, k };
      head.setPointerCapture(e.pointerId);
      this.root.classList.add('dragging');
    });
    head.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const d = this.drag;
      const left = Math.max(0, Math.min(1920 - 160, d.left + (e.clientX - d.x) / d.k));
      const top = Math.max(0, Math.min(1080 - 80, d.top + (e.clientY - d.y) / d.k));
      this.root.style.left = `${left}px`;
      this.root.style.top = `${top}px`;
    });
    const stop = () => {
      this.drag = null;
      this.root.classList.remove('dragging');
    };
    head.addEventListener('pointerup', stop);
    head.addEventListener('pointercancel', stop);
  }

  /** Mengisi satu lembar (utama atau jendela terpisah) dengan keadaan terbaru. */
  #fill(root, sizePx) {
    const { slide, index, total, beat } = this.host.getState();
    const lines = slide.script?.length ? slide.script : ['(Belum ada naskah untuk slide ini.)'];
    const body = root.querySelector('.paper-body');
    const active = Math.min(beat, lines.length - 1);
    const signature = `${slide.id}|${lines.length}`;
    if (body.dataset.sig !== signature) {
      body.innerHTML = lines
        .map(
          (text, i) =>
            `<p class="paper-line" data-beat="${i}">${lines.length > 1 ? `<i>${i + 1}</i>` : ''}<span></span></p>`
        )
        .join('');
      body.querySelectorAll('.paper-line span').forEach((el, i) => (el.textContent = lines[i]));
      body.dataset.sig = signature;
      body.scrollTop = 0;
    }
    root.style.setProperty('--paper-size', `${sizePx}px`);
    root.querySelector('.paper-where').textContent = `${String(index + 1).padStart(2, '0')}/${total} · ${slide.title}${
      lines.length > 1 ? ` · beat ${active + 1}/${lines.length}` : ''
    }`;
    const rows = [...body.querySelectorAll('.paper-line')];
    rows.forEach((row, i) => {
      row.classList.toggle('on', i === active);
      row.classList.toggle('done', i < active);
    });
    const target = rows[active];
    if (target) {
      const want = target.offsetTop - body.clientHeight * 0.18;
      body.scrollTo({ top: Math.max(0, want), behavior: 'smooth' });
    }
  }

  /** Dipanggil presenter setiap slide atau beat berubah. */
  update() {
    if (this.isOpen) this.#fill(this.root, this.size);
    if (this.popup && !this.popup.closed) this.#fill(this.popup.document.getElementById('paper-solo'), Math.round(this.size * 0.9));
  }

  openWindow() {
    if (this.popup && !this.popup.closed) {
      this.popup.focus();
      return;
    }
    const win = window.open('', 'naskah-presenter', 'width=980,height=720');
    if (!win) return;
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
    win.document.open();
    win.document.write(
      `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Naskah presenter</title>${css}</head>` +
        `<body class="paper-window"><div id="paper-solo" class="paper paper-solo">${markup(true)}</div></body></html>`
    );
    win.document.close();
    this.popup = win;
    const solo = win.document.getElementById('paper-solo');
    this.#wire(solo, true);
    win.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        this.host.goBeat(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.host.goBeat(-1);
      }
    });
    // Beri waktu stylesheet memuat sebelum mengisi dan menghitung gulir
    win.addEventListener('load', () => this.update());
    setTimeout(() => this.update(), 250);
  }
}
