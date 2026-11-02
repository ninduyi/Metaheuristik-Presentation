/**
 * Presenter: cangkang presentasi.
 * - Panggung 1920x1080 yang diskalakan ke jendela (satu sumber ukuran untuk DOM dan kanvas).
 * - "Spine" vertikal di kiri: satu simpul per bab, tanda kecil per slide, terisi mengikuti beat.
 * - Overview (kisi semua slide), lembar catatan dari bawah, dan lembar pintasan.
 * - Transisi iris: slide baru terbuka sebagai lingkaran dari titik klik, bab baru diawali kartu bab.
 */

const STAGE_W = 1920;
const STAGE_H = 1080;
const LEAVE_MS = 700;

const $ = (id) => document.getElementById(id);

export class Presenter {
  constructor(slides) {
    this.slides = slides;
    this.index = 0;
    this.beat = 0;
    this.current = null; // elemen slide aktif
    this.cleanup = null;
    this.hooks = null;
    this.calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.frame = $('frame');
    this.slidesEl = $('slides');
    this.spineEl = $('spine');
    this.counterEl = $('counter');
    this.chapterCard = $('chapter-card');
    this.notes = $('presenter-notes');
    this.overview = $('overview');
    this.help = $('shortcuts-modal');
  }

  start() {
    this.#buildSpine();
    this.#buildOverview();
    this.#bind();
    this.#fit();
    const wanted = location.hash.replace(/^#/, '').trim().toLowerCase();
    const found = this.slides.findIndex((s) => s.id === wanted);
    this.goTo(found >= 0 ? found : 0, { origin: { x: STAGE_W / 2, y: STAGE_H / 2 } });
  }

  /* ---------- struktur ---------- */

  /** Bab = kelompok slide berurutan dengan chapter.id sama. */
  get chapters() {
    const groups = [];
    this.slides.forEach((slide, i) => {
      const last = groups[groups.length - 1];
      if (last?.id === slide.chapter.id) last.indices.push(i);
      else groups.push({ id: slide.chapter.id, label: slide.chapter.label, indices: [i] });
    });
    return groups;
  }

  beatsOf(slide) {
    return slide.beats || 1;
  }

  #fit() {
    const k = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H);
    this.frame.style.transform = `translate(-50%, -50%) scale(${k})`;
    this.scale = k;
  }

  #buildSpine() {
    this.spineEl.innerHTML = this.chapters
      .map(
        (ch, n) => `
        <div class="spine-chapter" data-chapter="${ch.id}">
          <button type="button" class="spine-node" data-first="${ch.indices[0]}" aria-label="Bab ${n + 1}: ${ch.label}">
            <span>${n + 1}</span><em>${ch.label}</em>
          </button>
          <div class="spine-ticks">
            ${ch.indices
              .map((i) => `<button type="button" class="spine-tick" data-slide="${i}" title="${this.slides[i].title}" aria-label="Slide ${i + 1}: ${this.slides[i].title}"><i></i></button>`)
              .join('')}
          </div>
        </div>`
      )
      .join('');
    this.spineEl.addEventListener('click', (e) => {
      const tick = e.target.closest('.spine-tick');
      const node = e.target.closest('.spine-node');
      if (tick) this.goTo(Number(tick.dataset.slide), { event: e });
      else if (node) this.goTo(Number(node.dataset.first), { event: e });
    });
    this.ticks = [...this.spineEl.querySelectorAll('.spine-tick')];
    this.spineChapters = [...this.spineEl.querySelectorAll('.spine-chapter')];
  }

  #buildOverview() {
    const chapterNo = Object.fromEntries(this.chapters.map((c, n) => [c.id, n + 1]));
    this.overview.querySelector('.overview-grid').innerHTML = this.slides
      .map(
        (s, i) => `
        <button type="button" class="ov-card" data-slide="${i}" data-chapter="${s.chapter.id}">
          <small>${String(i + 1).padStart(2, '0')} · ${chapterNo[s.chapter.id]}. ${s.chapter.label}</small>
          <strong>${s.title}</strong>
        </button>`
      )
      .join('');
    this.overview.addEventListener('click', (e) => {
      const card = e.target.closest('.ov-card');
      if (card) {
        this.#toggle(this.overview, false);
        this.goTo(Number(card.dataset.slide), { event: e });
      } else if (e.target === this.overview) {
        this.#toggle(this.overview, false);
      }
    });
    this.ovCards = [...this.overview.querySelectorAll('.ov-card')];
  }

  /* ---------- peristiwa ---------- */

  #bind() {
    $('btn-prev').addEventListener('click', (e) => this.prev(e));
    $('btn-next').addEventListener('click', (e) => this.next(e));
    $('btn-notes').addEventListener('click', () => this.toggleNotes());
    $('btn-close-notes').addEventListener('click', () => this.toggleNotes(false));
    $('btn-overview').addEventListener('click', () => this.#toggle(this.overview));
    $('btn-help').addEventListener('click', () => this.#toggle(this.help));
    $('btn-close-help').addEventListener('click', () => this.#toggle(this.help, false));
    $('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());
    this.help.addEventListener('click', (e) => e.target === this.help && this.#toggle(this.help, false));

    addEventListener('keydown', (e) => this.#onKey(e));
    addEventListener('resize', () => this.#fit());
    addEventListener('hashchange', () => {
      const i = this.slides.findIndex((s) => s.id === location.hash.replace(/^#/, '').toLowerCase());
      if (i >= 0 && i !== this.index) this.goTo(i);
    });

    // Setelah diklik mouse, tombol dan slider dilepas fokusnya supaya panah dan spasi tetap memindahkan slide
    document.addEventListener('click', (e) => {
      const b = e.target.closest?.('button');
      if (b && e.detail > 0) b.blur();
    });
    document.addEventListener('change', (e) => e.target.type === 'range' && e.target.blur());
  }

  #typing(el) {
    return !!el && (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable);
  }

  #toggle(el, force) {
    const open = typeof force === 'boolean' ? force : el.classList.contains('hidden');
    el.classList.toggle('hidden', !open);
    if (el === this.overview && open) this.#markOverview();
    return open;
  }

  #onKey(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'Escape') {
      this.#toggle(this.help, false);
      this.#toggle(this.overview, false);
      this.toggleNotes(false);
      if (this.#typing(e.target)) e.target.blur();
      return;
    }
    if (this.#typing(e.target)) return;

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const onButton = e.target?.tagName === 'BUTTON';
    const run = (fn) => {
      e.preventDefault();
      fn();
    };

    if (key === 'ArrowRight' || key === 'PageDown' || ((key === ' ' || key === 'Enter') && !onButton)) run(() => this.next());
    else if (key === 'ArrowLeft' || key === 'PageUp') run(() => this.prev());
    else if (key === 'Home') run(() => this.goTo(0));
    else if (key === 'End') run(() => this.goTo(this.slides.length - 1));
    else if (/^[1-9]$/.test(key) && this.chapters[Number(key) - 1]) run(() => this.goTo(this.chapters[Number(key) - 1].indices[0]));
    else if (key === 'f') run(() => this.toggleFullscreen());
    else if (key === 'n') run(() => this.toggleNotes());
    else if (key === 'g' || key === 'o') run(() => this.#toggle(this.overview));
    else if (key === '?' || key === 'h') run(() => this.#toggle(this.help));
    else if (key === 'p' && this.hooks?.togglePlay) run(() => this.hooks.togglePlay());
    else if (key === 's' && this.hooks?.step) run(() => this.hooks.step());
    else if (key === 'r' && this.hooks?.reset) run(() => this.hooks.reset());
  }

  /* ---------- perpindahan ---------- */

  next(event) {
    if (this.beat < this.beatsOf(this.slides[this.index]) - 1) this.setBeat(this.beat + 1);
    else if (this.index < this.slides.length - 1) this.goTo(this.index + 1, { event });
  }

  prev(event) {
    if (this.beat > 0) this.setBeat(this.beat - 1);
    else if (this.index > 0) this.goTo(this.index - 1, { atEnd: true, event });
  }

  setBeat(beat) {
    this.beat = beat;
    this.hooks?.setBeat?.(beat);
    this.#refresh();
  }

  toggleNotes(force) {
    const open = this.#toggle(this.notes, force);
    $('btn-notes').setAttribute('aria-pressed', String(open));
  }

  toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  /** Titik asal iris dalam koordinat panggung: titik klik bila ada, kalau tidak sisi sesuai arah. */
  #originFor(event, forward) {
    if (event && typeof event.clientX === 'number' && event.detail > 0) {
      const box = this.frame.getBoundingClientRect();
      return { x: (event.clientX - box.left) / this.scale, y: (event.clientY - box.top) / this.scale };
    }
    return { x: forward ? STAGE_W - 120 : 140, y: STAGE_H / 2 };
  }

  /**
   * @param {number} index
   * @param {{atEnd?:boolean, event?:Event, origin?:{x:number,y:number}}} [opts]
   */
  goTo(index, { atEnd = false, event, origin } = {}) {
    if (index < 0 || index >= this.slides.length) return;
    try {
      this.cleanup?.();
    } catch (err) {
      console.error(err);
    }
    this.cleanup = null;
    this.hooks = null;

    const slide = this.slides[index];
    const forward = index >= this.index;
    const previousChapter = this.current ? this.slides[this.index].chapter.id : null;
    const at = origin ?? this.#originFor(event, forward);
    this.index = index;
    this.beat = 0;
    document.body.dataset.chapter = slide.chapter.id;

    const leaving = this.current;
    if (leaving) {
      leaving.classList.add('leaving');
      setTimeout(() => leaving.remove(), this.calm ? 0 : LEAVE_MS);
    }

    const el = document.createElement('section');
    el.className = 'slide';
    el.id = `slide-${slide.id}`;
    el.setAttribute('aria-label', slide.title);
    el.style.setProperty('--ox', `${at.x}px`);
    el.style.setProperty('--oy', `${at.y}px`);
    if (leaving && !this.calm) el.classList.add('iris');
    this.slidesEl.appendChild(el);
    this.current = el;

    const result = slide.mount(el, {
      reducedMotion: this.calm,
      registerHooks: (h) => (this.hooks = { ...this.hooks, ...h })
    });
    if (typeof result === 'function') this.cleanup = result;
    if (atEnd && this.beatsOf(slide) > 1) this.setBeat(this.beatsOf(slide) - 1);

    if (previousChapter && previousChapter !== slide.chapter.id) this.#showChapterCard(slide);

    $('notes-title').textContent = slide.title;
    $('notes-content').innerHTML = slide.notes || '';
    this.#refresh();
    try {
      history.replaceState(null, '', `#${slide.id}`);
    } catch {
      /* file:// bisa melarang riwayat */
    }
  }

  #showChapterCard(slide) {
    if (this.calm) return;
    const number = this.chapters.findIndex((c) => c.id === slide.chapter.id) + 1;
    this.chapterCard.innerHTML = `<b>${String(number).padStart(2, '0')}</b><span>${slide.chapter.label}</span>`;
    this.chapterCard.classList.remove('show');
    void this.chapterCard.offsetWidth; // reflow agar animasi bisa diputar ulang
    this.chapterCard.classList.add('show');
  }

  #markOverview() {
    this.ovCards.forEach((c, i) => c.classList.toggle('current', i === this.index));
    this.ovCards[this.index]?.scrollIntoView({ block: 'center' });
  }

  #refresh() {
    const beats = this.beatsOf(this.slides[this.index]);
    const progress = (this.beat + 1) / beats;
    this.ticks.forEach((t, i) => {
      t.style.setProperty('--fill', String(i < this.index ? 1 : i === this.index ? progress : 0));
      t.classList.toggle('current', i === this.index);
    });
    const chapter = this.slides[this.index].chapter.id;
    this.spineChapters.forEach((c) => c.classList.toggle('current', c.dataset.chapter === chapter));
    this.counterEl.textContent = `${String(this.index + 1).padStart(2, '0')} / ${this.slides.length}`;
  }
}
