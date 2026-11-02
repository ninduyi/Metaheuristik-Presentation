/* Firefly vs Bat: bundel untuk file://. Dibuat oleh scripts/build.mjs, jangan diedit tangan. */
(() => {
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // src/ui/script.js
  var SIZE_KEY = "fa_ba_deck_script_size_v1";
  var SIZE_MIN = 20;
  var SIZE_MAX = 56;
  var ICON = {
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    popout: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
  };
  var markup = (solo) => `
  <header class="paper-head">
    <b>Naskah</b>
    <span class="paper-where"></span>
    <div class="paper-tools">
      <button type="button" data-act="smaller" title="Huruf lebih kecil" aria-label="Huruf lebih kecil">A\u2212</button>
      <button type="button" data-act="bigger" title="Huruf lebih besar" aria-label="Huruf lebih besar">A+</button>
      ${solo ? "" : `<button type="button" data-act="popout" title="Buka di jendela terpisah" aria-label="Buka di jendela terpisah">${ICON.popout}</button>`}
      ${solo ? "" : `<button type="button" data-act="close" title="Tutup naskah (T)" aria-label="Tutup naskah">${ICON.close}</button>`}
    </div>
  </header>
  <div class="paper-body"></div>`;
  var _ScriptPaper_instances, loadSize_fn, saveSize_fn, wire_fn, enableDrag_fn, fill_fn;
  var ScriptPaper = class {
    /** @param {{getState:()=>{slide:object,index:number,total:number,beat:number}, scale:()=>number, goBeat:(d:number)=>void}} host */
    constructor(host) {
      __privateAdd(this, _ScriptPaper_instances);
      this.host = host;
      this.root = document.getElementById("script-paper");
      this.size = __privateMethod(this, _ScriptPaper_instances, loadSize_fn).call(this);
      this.popup = null;
      this.drag = null;
      this.root.innerHTML = markup(false);
      __privateMethod(this, _ScriptPaper_instances, wire_fn).call(this, this.root, false);
      __privateMethod(this, _ScriptPaper_instances, enableDrag_fn).call(this);
      this.setOpen(false);
    }
    get isOpen() {
      return !this.root.classList.contains("hidden");
    }
    setOpen(open) {
      this.root.classList.toggle("hidden", !open);
      document.getElementById("btn-script")?.setAttribute("aria-pressed", String(open));
      if (open) this.update();
    }
    toggle() {
      this.setOpen(!this.isOpen);
    }
    /** Dipanggil presenter setiap slide atau beat berubah. */
    update() {
      if (this.isOpen) __privateMethod(this, _ScriptPaper_instances, fill_fn).call(this, this.root, this.size);
      if (this.popup && !this.popup.closed) __privateMethod(this, _ScriptPaper_instances, fill_fn).call(this, this.popup.document.getElementById("paper-solo"), Math.round(this.size * 0.9));
    }
    openWindow() {
      if (this.popup && !this.popup.closed) {
        this.popup.focus();
        return;
      }
      const win = window.open("", "naskah-presenter", "width=980,height=720");
      if (!win) return;
      const css = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => `<link rel="stylesheet" href="${l.href}">`).join("");
      win.document.open();
      win.document.write(
        `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Naskah presenter</title>${css}</head><body class="paper-window"><div id="paper-solo" class="paper paper-solo">${markup(true)}</div></body></html>`
      );
      win.document.close();
      this.popup = win;
      const solo = win.document.getElementById("paper-solo");
      __privateMethod(this, _ScriptPaper_instances, wire_fn).call(this, solo, true);
      win.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
          e.preventDefault();
          this.host.goBeat(1);
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          this.host.goBeat(-1);
        }
      });
      win.addEventListener("load", () => this.update());
      setTimeout(() => this.update(), 250);
    }
  };
  _ScriptPaper_instances = new WeakSet();
  loadSize_fn = function() {
    try {
      const n = Number(localStorage.getItem(SIZE_KEY));
      if (n >= SIZE_MIN && n <= SIZE_MAX) return n;
    } catch {
    }
    return 32;
  };
  saveSize_fn = function() {
    try {
      localStorage.setItem(SIZE_KEY, String(this.size));
    } catch {
    }
  };
  wire_fn = function(root, solo) {
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "smaller" || act === "bigger") {
        this.size = Math.min(SIZE_MAX, Math.max(SIZE_MIN, this.size + (act === "bigger" ? 4 : -4)));
        __privateMethod(this, _ScriptPaper_instances, saveSize_fn).call(this);
        this.update();
      } else if (act === "close") this.setOpen(false);
      else if (act === "popout") this.openWindow();
    });
    if (solo) return;
  };
  /** Menggeser kertas dengan menyeret kepalanya. Koordinat dihitung dalam satuan panggung. */
  enableDrag_fn = function() {
    const head = this.root.querySelector(".paper-head");
    head.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      const k = this.host.scale() || 1;
      this.drag = { x: e.clientX, y: e.clientY, left: this.root.offsetLeft, top: this.root.offsetTop, k };
      head.setPointerCapture(e.pointerId);
      this.root.classList.add("dragging");
    });
    head.addEventListener("pointermove", (e) => {
      if (!this.drag) return;
      const d = this.drag;
      const left = Math.max(0, Math.min(1920 - 160, d.left + (e.clientX - d.x) / d.k));
      const top = Math.max(0, Math.min(1080 - 80, d.top + (e.clientY - d.y) / d.k));
      this.root.style.left = `${left}px`;
      this.root.style.top = `${top}px`;
    });
    const stop = () => {
      this.drag = null;
      this.root.classList.remove("dragging");
    };
    head.addEventListener("pointerup", stop);
    head.addEventListener("pointercancel", stop);
  };
  /** Mengisi satu lembar (utama atau jendela terpisah) dengan keadaan terbaru. */
  fill_fn = function(root, sizePx) {
    const { slide, index, total, beat } = this.host.getState();
    const lines = slide.script?.length ? slide.script : ["(Belum ada naskah untuk slide ini.)"];
    const body = root.querySelector(".paper-body");
    const active = Math.min(beat, lines.length - 1);
    const signature = `${slide.id}|${lines.length}`;
    if (body.dataset.sig !== signature) {
      body.innerHTML = lines.map(
        (text, i) => `<p class="paper-line" data-beat="${i}">${lines.length > 1 ? `<i>${i + 1}</i>` : ""}<span></span></p>`
      ).join("");
      body.querySelectorAll(".paper-line span").forEach((el, i) => el.textContent = lines[i]);
      body.dataset.sig = signature;
      body.scrollTop = 0;
    }
    root.style.setProperty("--paper-size", `${sizePx}px`);
    root.querySelector(".paper-where").textContent = `${String(index + 1).padStart(2, "0")}/${total} \xB7 ${slide.title}${lines.length > 1 ? ` \xB7 beat ${active + 1}/${lines.length}` : ""}`;
    const rows = [...body.querySelectorAll(".paper-line")];
    rows.forEach((row, i) => {
      row.classList.toggle("on", i === active);
      row.classList.toggle("done", i < active);
    });
    const target = rows[active];
    if (target) {
      const want = target.offsetTop - body.clientHeight * 0.18;
      body.scrollTo({ top: Math.max(0, want), behavior: "smooth" });
    }
  };

  // src/ui/presenter.js
  var STAGE_W = 1920;
  var STAGE_H = 1080;
  var LEAVE_MS = 700;
  var $ = (id) => document.getElementById(id);
  var _Presenter_instances, fit_fn, buildSpine_fn, buildOverview_fn, bind_fn, typing_fn, toggle_fn, onKey_fn, originFor_fn, showChapterCard_fn, markOverview_fn, refresh_fn;
  var Presenter = class {
    constructor(slides2) {
      __privateAdd(this, _Presenter_instances);
      this.slides = slides2;
      this.index = 0;
      this.beat = 0;
      this.current = null;
      this.cleanup = null;
      this.hooks = null;
      this.calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      this.frame = $("frame");
      this.slidesEl = $("slides");
      this.spineEl = $("spine");
      this.counterEl = $("counter");
      this.chapterCard = $("chapter-card");
      this.notes = $("presenter-notes");
      this.overview = $("overview");
      this.help = $("shortcuts-modal");
      this.paper = new ScriptPaper({
        getState: () => ({ slide: this.slides[this.index], index: this.index, total: this.slides.length, beat: this.beat }),
        scale: () => this.scale,
        goBeat: (d) => d > 0 ? this.next() : this.prev()
      });
    }
    start() {
      __privateMethod(this, _Presenter_instances, buildSpine_fn).call(this);
      __privateMethod(this, _Presenter_instances, buildOverview_fn).call(this);
      __privateMethod(this, _Presenter_instances, bind_fn).call(this);
      __privateMethod(this, _Presenter_instances, fit_fn).call(this);
      const wanted = location.hash.replace(/^#/, "").trim().toLowerCase();
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
      __privateMethod(this, _Presenter_instances, refresh_fn).call(this);
    }
    toggleNotes(force) {
      const open = __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.notes, force);
      $("btn-notes").setAttribute("aria-pressed", String(open));
    }
    toggleFullscreen() {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {
      });
      else document.documentElement.requestFullscreen?.().catch(() => {
      });
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
      const at = origin ?? __privateMethod(this, _Presenter_instances, originFor_fn).call(this, event, forward);
      this.index = index;
      this.beat = 0;
      document.body.dataset.chapter = slide.chapter.id;
      const leaving = this.current;
      if (leaving) {
        leaving.classList.add("leaving");
        setTimeout(() => leaving.remove(), this.calm ? 0 : LEAVE_MS);
      }
      const el = document.createElement("section");
      el.className = "slide";
      el.id = `slide-${slide.id}`;
      el.setAttribute("aria-label", slide.title);
      el.style.setProperty("--ox", `${at.x}px`);
      el.style.setProperty("--oy", `${at.y}px`);
      if (leaving && !this.calm) el.classList.add("iris");
      this.slidesEl.appendChild(el);
      this.current = el;
      const result = slide.mount(el, {
        reducedMotion: this.calm,
        registerHooks: (h) => this.hooks = { ...this.hooks, ...h }
      });
      if (typeof result === "function") this.cleanup = result;
      if (atEnd && this.beatsOf(slide) > 1) this.setBeat(this.beatsOf(slide) - 1);
      if (previousChapter && previousChapter !== slide.chapter.id) __privateMethod(this, _Presenter_instances, showChapterCard_fn).call(this, slide);
      $("notes-title").textContent = slide.title;
      $("notes-content").innerHTML = slide.notes || "";
      __privateMethod(this, _Presenter_instances, refresh_fn).call(this);
      try {
        history.replaceState(null, "", `#${slide.id}`);
      } catch {
      }
    }
  };
  _Presenter_instances = new WeakSet();
  fit_fn = function() {
    const k = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H);
    this.frame.style.transform = `translate(-50%, -50%) scale(${k})`;
    this.scale = k;
  };
  buildSpine_fn = function() {
    this.spineEl.innerHTML = this.chapters.map(
      (ch, n) => `
        <div class="spine-chapter" data-chapter="${ch.id}">
          <button type="button" class="spine-node" data-first="${ch.indices[0]}" aria-label="Bab ${n + 1}: ${ch.label}">
            <span>${n + 1}</span><em>${ch.label}</em>
          </button>
          <div class="spine-ticks">
            ${ch.indices.map((i) => `<button type="button" class="spine-tick" data-slide="${i}" title="${this.slides[i].title}" aria-label="Slide ${i + 1}: ${this.slides[i].title}"><i></i></button>`).join("")}
          </div>
        </div>`
    ).join("");
    this.spineEl.addEventListener("click", (e) => {
      const tick = e.target.closest(".spine-tick");
      const node = e.target.closest(".spine-node");
      if (tick) this.goTo(Number(tick.dataset.slide), { event: e });
      else if (node) this.goTo(Number(node.dataset.first), { event: e });
    });
    this.ticks = [...this.spineEl.querySelectorAll(".spine-tick")];
    this.spineChapters = [...this.spineEl.querySelectorAll(".spine-chapter")];
  };
  buildOverview_fn = function() {
    const chapterNo = Object.fromEntries(this.chapters.map((c, n) => [c.id, n + 1]));
    this.overview.querySelector(".overview-grid").innerHTML = this.slides.map(
      (s, i) => `
        <button type="button" class="ov-card" data-slide="${i}" data-chapter="${s.chapter.id}">
          <small>${String(i + 1).padStart(2, "0")} \xB7 ${chapterNo[s.chapter.id]}. ${s.chapter.label}</small>
          <strong>${s.title}</strong>
        </button>`
    ).join("");
    this.overview.addEventListener("click", (e) => {
      const card = e.target.closest(".ov-card");
      if (card) {
        __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.overview, false);
        this.goTo(Number(card.dataset.slide), { event: e });
      } else if (e.target === this.overview) {
        __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.overview, false);
      }
    });
    this.ovCards = [...this.overview.querySelectorAll(".ov-card")];
  };
  /* ---------- peristiwa ---------- */
  bind_fn = function() {
    $("btn-prev").addEventListener("click", (e) => this.prev(e));
    $("btn-next").addEventListener("click", (e) => this.next(e));
    $("btn-script").addEventListener("click", () => this.paper.toggle());
    $("btn-notes").addEventListener("click", () => this.toggleNotes());
    $("btn-close-notes").addEventListener("click", () => this.toggleNotes(false));
    $("btn-overview").addEventListener("click", () => __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.overview));
    $("btn-help").addEventListener("click", () => __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.help));
    $("btn-close-help").addEventListener("click", () => __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.help, false));
    $("btn-fullscreen").addEventListener("click", () => this.toggleFullscreen());
    this.help.addEventListener("click", (e) => e.target === this.help && __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.help, false));
    addEventListener("keydown", (e) => __privateMethod(this, _Presenter_instances, onKey_fn).call(this, e));
    addEventListener("resize", () => __privateMethod(this, _Presenter_instances, fit_fn).call(this));
    addEventListener("hashchange", () => {
      const i = this.slides.findIndex((s) => s.id === location.hash.replace(/^#/, "").toLowerCase());
      if (i >= 0 && i !== this.index) this.goTo(i);
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest?.("button");
      if (b && e.detail > 0) b.blur();
    });
    document.addEventListener("change", (e) => e.target.type === "range" && e.target.blur());
  };
  typing_fn = function(el) {
    return !!el && (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) || el.isContentEditable);
  };
  toggle_fn = function(el, force) {
    const open = typeof force === "boolean" ? force : el.classList.contains("hidden");
    el.classList.toggle("hidden", !open);
    if (el === this.overview && open) __privateMethod(this, _Presenter_instances, markOverview_fn).call(this);
    return open;
  };
  onKey_fn = function(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === "Escape") {
      __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.help, false);
      __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.overview, false);
      this.toggleNotes(false);
      this.paper.setOpen(false);
      if (__privateMethod(this, _Presenter_instances, typing_fn).call(this, e.target)) e.target.blur();
      return;
    }
    if (__privateMethod(this, _Presenter_instances, typing_fn).call(this, e.target)) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const onButton = e.target?.tagName === "BUTTON";
    const run = (fn) => {
      e.preventDefault();
      fn();
    };
    if (key === "ArrowRight" || key === "PageDown" || (key === " " || key === "Enter") && !onButton) run(() => this.next());
    else if (key === "ArrowLeft" || key === "PageUp") run(() => this.prev());
    else if (key === "Home") run(() => this.goTo(0));
    else if (key === "End") run(() => this.goTo(this.slides.length - 1));
    else if (/^[1-9]$/.test(key) && this.chapters[Number(key) - 1]) run(() => this.goTo(this.chapters[Number(key) - 1].indices[0]));
    else if (key === "f") run(() => this.toggleFullscreen());
    else if (key === "t") run(() => this.paper.toggle());
    else if (key === "n") run(() => this.toggleNotes());
    else if (key === "g" || key === "o") run(() => __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.overview));
    else if (key === "?" || key === "h") run(() => __privateMethod(this, _Presenter_instances, toggle_fn).call(this, this.help));
    else if (key === "p" && this.hooks?.togglePlay) run(() => this.hooks.togglePlay());
    else if (key === "s" && this.hooks?.step) run(() => this.hooks.step());
    else if (key === "r" && this.hooks?.reset) run(() => this.hooks.reset());
  };
  /** Titik asal iris dalam koordinat panggung: titik klik bila ada, kalau tidak sisi sesuai arah. */
  originFor_fn = function(event, forward) {
    if (event && typeof event.clientX === "number" && event.detail > 0) {
      const box = this.frame.getBoundingClientRect();
      return { x: (event.clientX - box.left) / this.scale, y: (event.clientY - box.top) / this.scale };
    }
    return { x: forward ? STAGE_W - 120 : 140, y: STAGE_H / 2 };
  };
  showChapterCard_fn = function(slide) {
    if (this.calm) return;
    const number = this.chapters.findIndex((c) => c.id === slide.chapter.id) + 1;
    this.chapterCard.innerHTML = `<b>${String(number).padStart(2, "0")}</b><span>${slide.chapter.label}</span>`;
    this.chapterCard.classList.remove("show");
    void this.chapterCard.offsetWidth;
    this.chapterCard.classList.add("show");
  };
  markOverview_fn = function() {
    this.ovCards.forEach((c, i) => c.classList.toggle("current", i === this.index));
    this.ovCards[this.index]?.scrollIntoView({ block: "center" });
  };
  refresh_fn = function() {
    const beats = this.beatsOf(this.slides[this.index]);
    const progress = (this.beat + 1) / beats;
    this.ticks.forEach((t, i) => {
      t.style.setProperty("--fill", String(i < this.index ? 1 : i === this.index ? progress : 0));
      t.classList.toggle("current", i === this.index);
    });
    const chapter = this.slides[this.index].chapter.id;
    this.spineChapters.forEach((c) => c.classList.toggle("current", c.dataset.chapter === chapter));
    this.paper?.update();
    this.counterEl.textContent = `${String(this.index + 1).padStart(2, "0")} / ${this.slides.length}`;
  };

  // src/render/motion.js
  var STAGE_W2 = 1920;
  var STAGE_H2 = 1080;
  var clamp01 = (v) => Math.min(1, Math.max(0, v));
  var lerp = (a, b, t) => a + (b - a) * t;
  var easeOut = (t) => 1 - (1 - t) ** 3;
  var easeInOut = (t) => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
  var easeBack = (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
  function seg(time, start, length, ease = easeInOut) {
    return ease(clamp01((time - start) / Math.max(1e-6, length)));
  }
  function startCanvasLoop(canvas, draw, { calm = false, width = STAGE_W2, height: height2 = STAGE_H2 } = {}) {
    let frameId = 0;
    let t0 = null;
    let beatT0 = null;
    let prev = null;
    let beat = 0;
    const tick = (now) => {
      t0 ?? (t0 = now);
      beatT0 ?? (beatT0 = now);
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.max(10, Math.floor(box.width * ratio));
      const bh = Math.max(10, Math.floor(box.height * ratio));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(bw / width, 0, 0, bh / height2, 0, 0);
      const dt = prev === null ? 0 : Math.min(0.1, (now - prev) / 1e3);
      prev = now;
      draw(ctx, { t: calm ? 0 : (now - t0) / 1e3, bt: calm ? 60 : (now - beatT0) / 1e3, beat, dt });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return {
      setBeat(next) {
        beat = next;
        beatT0 = null;
      },
      stop() {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };
  }
  function fitCanvas(canvas) {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(10, Math.floor(box.width));
    const height2 = Math.max(10, Math.floor(box.height));
    if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height2 * ratio)) {
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height2 * ratio);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width, height: height2 };
  }

  // src/render/sprites.js
  var COLORS = {
    ink: "#f2f7ff",
    muted: "#a9bbd6",
    night: "#050d26",
    navy: "#0b1a40",
    blue: "#3b82f6",
    blueLight: "#93c5fd",
    cyan: "#22d3ee",
    cyanLight: "#a5f3fc",
    purple: "#8b5cf6",
    purpleLight: "#c4b5fd",
    pink: "#f472b6",
    gold: "#fbbf24",
    lime: "#a3e635",
    coral: "#fb7185"
  };
  var FONT_BODY = '"Manrope", "Sora", sans-serif';
  var FONT_MONO = '"Red Hat Mono", "Manrope", monospace';
  function drawText(ctx, text, x, y, options = {}) {
    const { size = 30, weight = 700, color = COLORS.ink, align = "left", mono = false, alpha = 1, baseline = "middle" } = options;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  function drawPill(ctx, text, x, y, options = {}) {
    const { size = 28, weight = 700, color = COLORS.night, fill = COLORS.gold, alpha = 1, mono = false } = options;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_BODY}`;
    const w = ctx.measureText(text).width + size * 1.2;
    const h = size * 1.75;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y + 1);
    ctx.restore();
  }
  function drawGlow(ctx, x, y, radius, color) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  function pseudo(i) {
    const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }
  var TINTS = {
    blue: { top: "#071433", mid: "#0b1f55", bottom: "#0a1030", orbs: ["#2563eb", "#22d3ee", "#8b5cf6"] },
    cyan: { top: "#04142e", mid: "#062a4d", bottom: "#041a2e", orbs: ["#22d3ee", "#3b82f6", "#8b5cf6"] },
    purple: { top: "#0b0b2e", mid: "#1c1252", bottom: "#0a0a26", orbs: ["#8b5cf6", "#ec4899", "#3b82f6"] },
    gold: { top: "#0a1233", mid: "#17154a", bottom: "#080f2b", orbs: ["#f59e0b", "#8b5cf6", "#22d3ee"] }
  };
  function drawBackdrop(ctx, t, tint = "blue", W = 1920, H = 1080) {
    const p = TINTS[tint] || TINTS.blue;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, p.top);
    grad.addColorStop(0.55, p.mid);
    grad.addColorStop(1, p.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    p.orbs.forEach((color, i) => {
      const ox = W * (0.2 + 0.3 * i) + Math.sin(t * 0.13 + i * 2.1) * 140;
      const oy = H * (0.35 + 0.18 * Math.sin(i * 1.7)) + Math.cos(t * 0.11 + i) * 90;
      drawGlow(ctx, ox, oy, 560, hexToRgba(color, 0.2));
    });
    ctx.restore();
    ctx.fillStyle = "rgba(165, 190, 255, 0.07)";
    for (let gx = 40; gx < W; gx += 80) {
      for (let gy = 40; gy < H; gy += 80) ctx.fillRect(gx, gy, 3, 3);
    }
    for (let i = 0; i < 70; i++) {
      const sx = pseudo(i + 1) * W;
      const sy = pseudo(i + 91) * H * 0.9;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + pseudo(i + 7)) + i));
      ctx.fillStyle = `rgba(220, 235, 255, ${(0.18 + 0.5 * pseudo(i + 33)) * tw})`;
      const s = 1.5 + pseudo(i + 55) * 2.4;
      ctx.fillRect(sx, sy, s, s);
    }
  }
  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
    return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${alpha})`;
  }
  function drawFirefly(ctx, x, y, size, options = {}) {
    const { glow = 1, color = COLORS.cyan, core = "#f4fdff", t = 0, angle = 0, alpha = 1, crown = false } = options;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.globalCompositeOperation = "lighter";
    const g = Math.max(0.05, Math.min(1, glow));
    drawGlow(ctx, x, y, size * (1.2 + 3.6 * g), hexToRgba(color, 0.18 + 0.5 * g));
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    const flap = Math.sin(t * 38 + x * 0.1) * 0.35;
    ctx.fillStyle = "rgba(200, 235, 255, 0.45)";
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * (0.7 + flap));
      ctx.beginPath();
      ctx.ellipse(side * size * 0.45, -size * 0.35, size * 0.55, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#10243f";
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.2, size * 0.2, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(core, 0.35 + 0.65 * g);
    ctx.beginPath();
    ctx.ellipse(0, size * 0.28, size * 0.3, size * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(color, 0.55 * g);
    ctx.beginPath();
    ctx.ellipse(0, size * 0.28, size * 0.2, size * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (crown) drawCrown(ctx, x, y - size * 0.95, size * 0.62);
  }
  function drawCrown(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-size, size * 0.5);
    ctx.lineTo(-size, -size * 0.4);
    ctx.lineTo(-size * 0.5, size * 0.05);
    ctx.lineTo(0, -size * 0.6);
    ctx.lineTo(size * 0.5, size * 0.05);
    ctx.lineTo(size, -size * 0.4);
    ctx.lineTo(size, size * 0.5);
    ctx.closePath();
    ctx.fillStyle = COLORS.gold;
    ctx.strokeStyle = COLORS.night;
    ctx.lineWidth = Math.max(1.5, size * 0.12);
    ctx.lineJoin = "round";
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function batWing(ctx, side, s, f) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1);
    ctx.quadraticCurveTo(side * s * 0.9, -s * (0.75 + 0.5 * f), side * s * 1.7, -s * (0.2 + 0.9 * f));
    ctx.quadraticCurveTo(side * s * 1.4, s * (0.05 - 0.2 * f), side * s * 1.2, s * (0.4 - 0.3 * f));
    ctx.quadraticCurveTo(side * s * 0.9, s * (0.1 - 0.1 * f), side * s * 0.62, s * 0.5);
    ctx.quadraticCurveTo(side * s * 0.34, s * 0.22, 0, s * 0.55);
    ctx.closePath();
  }
  function drawBat(ctx, x, y, size, options = {}) {
    const { color = COLORS.purple, edge = COLORS.purpleLight, flap = 0, angle = 0, alpha = 1, crown = false, glow = 0 } = options;
    const f = Math.sin(flap);
    if (glow > 0) {
      ctx.save();
      ctx.globalAlpha *= alpha;
      drawGlow(ctx, x, y, size * (2 + 2 * glow), hexToRgba(edge, 0.3 * glow));
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(1.5, size * 0.07);
    ctx.lineJoin = "round";
    for (const side of [-1, 1]) {
      batWing(ctx, side, size, f);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, size * 0.1, size * 0.28, size * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * size * 0.08, -size * 0.58);
      ctx.lineTo(side * size * 0.3, -size * 0.92);
      ctx.lineTo(side * size * 0.3, -size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * size * 0.1, -size * 0.43, size * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (crown) drawCrown(ctx, x, y - size * 1.15, size * 0.55);
  }
  function drawEcho(ctx, x, y, progress, color = COLORS.purpleLight, maxRadius = 120, alpha = 1) {
    if (progress <= 0 || progress >= 1) return;
    ctx.save();
    ctx.strokeStyle = color;
    for (const delay of [0, 0.25, 0.5]) {
      const p = (progress - delay) / (1 - delay);
      if (p <= 0 || p >= 1) continue;
      ctx.globalAlpha = (1 - p) * 0.75 * alpha;
      ctx.lineWidth = Math.max(1.4, maxRadius * 0.035 * (1 - p));
      ctx.beginPath();
      ctx.arc(x, y, maxRadius * p, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawStar(ctx, x, y, size, options = {}) {
    const { glow = true, alpha = 1 } = options;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (glow) drawGlow(ctx, x, y, size * 2.8, "rgba(251, 191, 36, 0.62)");
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size : size * 0.44;
      const a = i * Math.PI / 5 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = COLORS.gold;
    ctx.strokeStyle = COLORS.night;
    ctx.lineWidth = Math.max(1, size * 0.14);
    ctx.lineJoin = "round";
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function arcPoint(from, to, bend, p) {
    const cx = (from.x + to.x) / 2;
    const cy = (from.y + to.y) / 2 - bend;
    const q = 1 - p;
    return {
      x: q * q * from.x + 2 * q * p * cx + p * p * to.x,
      y: q * q * from.y + 2 * q * p * cy + p * p * to.y
    };
  }
  function drawArrow(ctx, from, to, options = {}) {
    const { bend = 0, color = COLORS.ink, width = 4, progress = 1, dashed = false, alpha = 1, head = true } = options;
    if (progress <= 0) return;
    const tip = arcPoint(from, to, bend, progress);
    const before = arcPoint(from, to, bend, Math.max(0, progress - 0.03));
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    if (dashed) ctx.setLineDash([width * 3, width * 2.4]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    const steps = Math.max(2, Math.ceil(progress * 28));
    for (let i = 1; i <= steps; i++) {
      const pt = arcPoint(from, to, bend, i / steps * progress);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    if (head) {
      const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
      const len = width * 4;
      ctx.beginPath();
      ctx.moveTo(tip.x + Math.cos(angle) * len * 0.3, tip.y + Math.sin(angle) * len * 0.3);
      ctx.lineTo(tip.x - Math.cos(angle - 0.5) * len, tip.y - Math.sin(angle - 0.5) * len);
      ctx.lineTo(tip.x - Math.cos(angle + 0.5) * len, tip.y - Math.sin(angle + 0.5) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  function drawCross(ctx, x, y, size, color = COLORS.coral, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, size * 0.32);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
    ctx.restore();
  }
  function drawCheck(ctx, x, y, size, color = COLORS.lime, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, size * 0.32);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - size * 0.3, y + size * 0.7);
    ctx.lineTo(x + size, y - size * 0.7);
    ctx.stroke();
    ctx.restore();
  }
  function drawMath(ctx, text, x, y, options = {}) {
    const { size = 34, color = COLORS.ink, weight = 600, alpha = 1, measureOnly = false } = options;
    const tokens = [];
    const re = /([_^])(\{[^}]*\}|.)|([^_^]+)/g;
    let m;
    while (m = re.exec(text)) {
      if (m[3] !== void 0) tokens.push({ t: m[3], mode: "n" });
      else tokens.push({ t: m[2].replace(/^\{|\}$/g, ""), mode: m[1] === "_" ? "sub" : "sup" });
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let cx = x;
    for (const tok of tokens) {
      const small = tok.mode !== "n";
      const s = small ? size * 0.62 : size;
      ctx.font = `${weight} ${s}px ${FONT_MONO}`;
      const dy = tok.mode === "sub" ? size * 0.22 : tok.mode === "sup" ? -size * 0.3 : 0;
      if (!measureOnly) ctx.fillText(tok.t, cx, y + dy);
      cx += ctx.measureText(tok.t).width;
    }
    ctx.restore();
    return cx - x;
  }

  // src/render/cloudRenderer.js
  var TASK_COLORS = ["#3b82f6", "#22d3ee", "#8b5cf6", "#f472b6", "#fbbf24", "#a3e635", "#fb7185", "#38bdf8"];
  function taskColor(id) {
    return TASK_COLORS[(id - 1) % TASK_COLORS.length];
  }
  function layoutOf(ev) {
    const map = /* @__PURE__ */ new Map();
    ev.vmTasks.forEach((list, lane) => {
      for (const t of list) map.set(t.id, { lane, start: t.start, dur: t.execSec, mi: t.mi });
    });
    return map;
  }
  var lerp2 = (a, b, t) => a + (b - a) * t;
  function drawSchedule(ctx, rect, tasks, vms, to, opts = {}) {
    const { from = null, alpha = 1, tMax, makespan = null, ideal = null, appear = null, queue = null, laneColor = COLORS.blue, labelW = 168, fontScale = 1 } = opts;
    const laneGap = 14;
    const laneH = (rect.h - laneGap * (vms.length - 1)) / vms.length;
    const trackX = rect.x + labelW;
    const trackW = rect.w - labelW;
    const secToPx = trackW / tMax;
    vms.forEach((vm, j) => {
      const y = rect.y + j * (laneH + laneGap);
      ctx.fillStyle = hexToRgba(laneColor, 0.1);
      ctx.beginPath();
      ctx.roundRect(trackX, y, trackW, laneH, 14);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(laneColor, 0.35);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = hexToRgba(laneColor, 0.22);
      ctx.beginPath();
      ctx.roundRect(rect.x, y, labelW - 12, laneH, 14);
      ctx.fill();
      drawText(ctx, vm.name, rect.x + 16, y + laneH * 0.36, { size: Math.min(30, laneH * 0.34) * fontScale, color: COLORS.ink });
      drawText(ctx, `${vm.mips} MIPS`, rect.x + 16, y + laneH * 0.72, { size: Math.min(22, laneH * 0.26) * fontScale, weight: 600, color: COLORS.muted, mono: true });
    });
    if (ideal != null) {
      const ix = trackX + ideal * secToPx;
      ctx.save();
      ctx.strokeStyle = hexToRgba(COLORS.lime, 0.85);
      ctx.lineWidth = 3;
      ctx.setLineDash([3, 8]);
      ctx.beginPath();
      ctx.moveTo(ix, rect.y - 14);
      ctx.lineTo(ix, rect.y + rect.h + 6);
      ctx.stroke();
      ctx.restore();
    }
    tasks.forEach((task, idx) => {
      const target = to.get(task.id);
      if (!target) return;
      const prev = from && from.get(task.id) ? from.get(task.id) : target;
      const lane = lerp2(prev.lane, target.lane, alpha);
      const start = lerp2(prev.start, target.start, alpha);
      const dur = lerp2(prev.dur, target.dur, alpha);
      let bx = trackX + start * secToPx;
      let by = rect.y + lane * (laneH + laneGap) + 6;
      let bw = Math.max(4, dur * secToPx - 3);
      const bh = laneH - 12;
      let a = 1;
      if (appear) {
        const p = appear(idx);
        if (p <= 0) return;
        if (p < 1 && queue) {
          const e = 1 - Math.pow(1 - p, 3);
          bx = lerp2(queue.x + idx % 4 * 8, bx, e);
          by = lerp2(queue.y + idx % 5 * 6, by, e) - Math.sin(Math.PI * e) * 120;
        }
        a = Math.min(1, p * 3);
      }
      const color = taskColor(task.id);
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 9);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh * 0.4, 9);
      ctx.fill();
      if (bw > 38 * fontScale) {
        drawText(ctx, task.name, bx + bw / 2, by + bh / 2, {
          size: Math.min(24, bh * 0.46) * fontScale,
          color: "#050d26",
          align: "center",
          weight: 800
        });
      }
      ctx.restore();
    });
    if (makespan != null) {
      const mx = trackX + makespan * secToPx;
      ctx.save();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(mx, rect.y - 14);
      ctx.lineTo(mx, rect.y + rect.h + 6);
      ctx.stroke();
      ctx.restore();
    }
  }

  // src/core/random.js
  function splitmix32(seed) {
    let s = seed >>> 0;
    return () => {
      s = s + 2654435769 >>> 0;
      let z = s;
      z = Math.imul(z ^ z >>> 16, 569420461);
      z = Math.imul(z ^ z >>> 15, 1935289751);
      return (z ^ z >>> 15) >>> 0;
    };
  }
  function seedToInt(seed) {
    if (typeof seed === "number" && Number.isFinite(seed)) return Math.trunc(seed) >>> 0;
    let h = 2166136261;
    for (const ch of String(seed ?? "42")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  function createRandom(seed = 42) {
    const mix2 = splitmix32(seedToInt(seed));
    let a = mix2();
    let b = mix2();
    let c = mix2();
    let d = mix2();
    const next = () => {
      const t = (a + b >>> 0) + d >>> 0;
      d = d + 1 >>> 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) >>> 0;
      c = (c << 21 | c >>> 11) >>> 0;
      c = c + t >>> 0;
      return t / 4294967296;
    };
    for (let i = 0; i < 12; i++) next();
    return {
      next,
      /** Bilangan real di [lo, hi). */
      range: (lo, hi) => lo + (hi - lo) * next(),
      /** Bilangan bulat di [lo, hi], keduanya termasuk. */
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1))
    };
  }

  // src/algorithms/firefly.js
  var FA_DEFAULTS = {
    populationSize: 20,
    maxIterations: 30,
    beta0: 1,
    gamma: 2,
    alpha: 0.25,
    alphaDecay: 0.96
  };
  function attractiveness(beta0, gamma, r) {
    return beta0 * Math.exp(-gamma * r * r);
  }
  var FAEngine = class {
    constructor(config = {}) {
      this.configure(config);
    }
    configure(config = {}) {
      const c = { ...FA_DEFAULTS, ...config };
      this.dim = c.dim ?? 2;
      this.lo = c.lo ?? 0;
      this.hi = c.hi ?? 1;
      this.span = this.hi - this.lo;
      this.fitnessFn = c.fitness;
      this.populationSize = Math.max(2, Math.round(c.populationSize));
      this.maxIterations = Math.max(1, Math.round(c.maxIterations));
      this.beta0 = c.beta0;
      this.gamma = c.gamma;
      this.alpha0 = c.alpha;
      this.alphaDecay = c.alphaDecay;
      this.seed = c.seed ?? 42;
      this.initial = c.initial || null;
      this.reset();
    }
    clamp(v) {
      return v < this.lo ? this.lo : v > this.hi ? this.hi : v;
    }
    reset() {
      this.rng = createRandom(Number(this.seed) + 202);
      this.iteration = 0;
      this.alpha = this.alpha0;
      this.evaluations = 0;
      this.agents = [];
      for (let i = 0; i < this.populationSize; i++) {
        const x = this.initial && this.initial[i] ? this.initial[i].slice() : Array.from({ length: this.dim }, () => this.rng.range(this.lo, this.hi));
        this.agents.push({
          x,
          px: x.slice(),
          f: this.evalFitness(x),
          glow: 0,
          attractor: -1,
          pull: 0,
          stepFrom: x.slice(),
          rank: 0
        });
      }
      this.bestEver = null;
      this.updateBest();
      this.rankAgents();
      this.history = [{ iteration: 0, bestFitness: this.bestEver.f }];
      this.phase = "INIT";
      this.phaseLabel = "Sebar kunang-kunang";
      this.phaseDetail = `Menyebar ${this.populationSize} kunang-kunang secara acak di ruang pencarian.`;
      this.done = false;
      return this.getState();
    }
    evalFitness(x) {
      this.evaluations++;
      return this.fitnessFn(x);
    }
    updateBest() {
      for (const a of this.agents) {
        if (!this.bestEver || a.f < this.bestEver.f) this.bestEver = { x: a.x.slice(), f: a.f };
      }
    }
    /** Peringkat 0 = paling terang. Glow dinormalkan 0..1 dari peringkat agar kecerahan terlihat jelas. */
    rankAgents() {
      const order = this.agents.map((_, i) => i).sort((a, b) => this.agents[a].f - this.agents[b].f);
      order.forEach((idx, rank) => {
        this.agents[idx].rank = rank;
        this.agents[idx].glow = 1 - rank / Math.max(1, order.length - 1);
      });
      this.brightestIndex = order[0];
    }
    distance(a, b) {
      let s = 0;
      for (let d = 0; d < this.dim; d++) {
        const diff = (a[d] - b[d]) / this.span;
        s += diff * diff;
      }
      return Math.sqrt(s / this.dim);
    }
    step() {
      if (this.done) return this.getState();
      for (const a of this.agents) {
        a.px = a.x.slice();
        a.attractor = -1;
        a.pull = 0;
      }
      if (this.phase === "INIT" || this.phase === "WALK") {
        this.phase = "EVAL";
        this.phaseLabel = "Ukur kecerahan";
        this.rankAgents();
        const best = this.agents[this.brightestIndex];
        this.phaseDetail = `Kecerahan = kualitas solusi. Paling terang: f = ${best.f.toFixed(3)}.`;
        return this.getState();
      }
      if (this.phase === "EVAL") {
        this.phase = "MOVE";
        this.phaseLabel = "Terbang ke yang lebih terang";
        const snapshot = this.agents.map((a) => ({ x: a.x.slice(), f: a.f }));
        let moves = 0;
        for (let i = 0; i < this.agents.length; i++) {
          const me = this.agents[i];
          let strongest = 0;
          for (let j = 0; j < snapshot.length; j++) {
            if (snapshot[j].f < me.f) {
              const r = this.distance(me.x, snapshot[j].x);
              const beta = attractiveness(this.beta0, this.gamma, r);
              for (let d = 0; d < this.dim; d++) me.x[d] += beta * (snapshot[j].x[d] - me.x[d]);
              moves++;
              if (beta > strongest) {
                strongest = beta;
                me.attractor = j;
              }
            }
          }
          me.pull = strongest;
        }
        this.phaseDetail = `${moves} tarikan terjadi. Makin jauh, makin lemah (\u03B2 = \u03B2\u2080\xB7e^(\u2212\u03B3r\xB2)).`;
        return this.getState();
      }
      this.phase = "WALK";
      this.phaseLabel = "Langkah acak kecil";
      const stepSize = this.alpha * this.span;
      for (const a of this.agents) {
        a.stepFrom = a.x.slice();
        for (let d = 0; d < this.dim; d++) {
          a.x[d] = this.clamp(a.x[d] + stepSize * (this.rng.next() - 0.5));
        }
        a.f = this.evalFitness(a.x);
      }
      this.updateBest();
      this.iteration++;
      this.alpha *= this.alphaDecay;
      this.history.push({ iteration: this.iteration, bestFitness: this.bestEver.f });
      this.phaseDetail = `Iterasi ${this.iteration}: terbaik f = ${this.bestEver.f.toFixed(3)}. Langkah acak menyusut ke \u03B1 = ${this.alpha.toFixed(3)}.`;
      if (this.iteration >= this.maxIterations) {
        this.phase = "DONE";
        this.phaseLabel = "Selesai";
        this.done = true;
        this.phaseDetail = `Selesai setelah ${this.iteration} iterasi dan ${this.evaluations} evaluasi. Terbaik f = ${this.bestEver.f.toFixed(4)}.`;
      }
      return this.getState();
    }
    /** Jalankan tahap sampai satu iterasi penuh selesai (dipakai simulasi cloud). */
    runIteration() {
      const target = this.iteration + 1;
      let guard = 0;
      while (!this.done && this.iteration < target && guard++ < 10) this.step();
      return this.getState();
    }
    getState() {
      return {
        kind: "FA",
        phase: this.phase,
        phaseLabel: this.phaseLabel,
        phaseDetail: this.phaseDetail,
        iteration: this.iteration,
        maxIterations: this.maxIterations,
        evaluations: this.evaluations,
        alpha: this.alpha,
        agents: this.agents,
        brightestIndex: this.brightestIndex,
        best: this.bestEver ? { x: this.bestEver.x.slice(), fitness: this.bestEver.f } : null,
        history: this.history,
        done: this.done,
        params: { beta0: this.beta0, gamma: this.gamma, alpha0: this.alpha0 }
      };
    }
  };

  // src/algorithms/bat.js
  var BA_DEFAULTS = {
    populationSize: 20,
    maxIterations: 30,
    fmin: 0,
    fmax: 1.5,
    loudness: 1,
    pulseRate: 0.5,
    alphaA: 0.9,
    gammaR: 0.9,
    localScale: 0.1
  };
  function loudnessAt(a0, alphaA, k) {
    return a0 * Math.pow(alphaA, k);
  }
  function pulseRateAt(r0, gammaR, t) {
    return r0 * (1 - Math.exp(-gammaR * t));
  }
  var BAEngine = class {
    constructor(config = {}) {
      this.configure(config);
    }
    configure(config = {}) {
      const c = { ...BA_DEFAULTS, ...config };
      this.dim = c.dim ?? 2;
      this.lo = c.lo ?? 0;
      this.hi = c.hi ?? 1;
      this.span = this.hi - this.lo;
      this.fitnessFn = c.fitness;
      this.populationSize = Math.max(2, Math.round(c.populationSize));
      this.maxIterations = Math.max(1, Math.round(c.maxIterations));
      this.fmin = c.fmin;
      this.fmax = c.fmax;
      this.A0 = c.loudness;
      this.r0 = c.pulseRate;
      this.alphaA = c.alphaA;
      this.gammaR = c.gammaR;
      this.localScale = c.localScale;
      this.seed = c.seed ?? 42;
      this.initial = c.initial || null;
      this.reset();
    }
    clamp(v) {
      return v < this.lo ? this.lo : v > this.hi ? this.hi : v;
    }
    reset() {
      this.rng = createRandom(Number(this.seed) + 101);
      this.iteration = 0;
      this.evaluations = 0;
      this.agents = [];
      for (let i = 0; i < this.populationSize; i++) {
        const x = this.initial && this.initial[i] ? this.initial[i].slice() : Array.from({ length: this.dim }, () => this.rng.range(this.lo, this.hi));
        this.agents.push({
          x,
          px: x.slice(),
          v: new Array(this.dim).fill(0),
          f: this.evalFitness(x),
          A: this.A0,
          r: 0,
          freq: 0,
          trial: null,
          trialPrev: null,
          trialF: null,
          mode: null,
          accepted: null
        });
      }
      this.bestEver = null;
      this.updateBest();
      this.history = [{ iteration: 0, bestFitness: this.bestEver.f }];
      this.phase = "INIT";
      this.phaseLabel = "Sebar kelelawar";
      this.phaseDetail = `Menyebar ${this.populationSize} kelelawar secara acak. Kenyaringan awal A = ${this.A0}.`;
      this.done = false;
      return this.getState();
    }
    evalFitness(x) {
      this.evaluations++;
      return this.fitnessFn(x);
    }
    updateBest() {
      for (const a of this.agents) {
        if (!this.bestEver || a.f < this.bestEver.f) this.bestEver = { x: a.x.slice(), f: a.f };
      }
    }
    meanLoudness() {
      return this.agents.reduce((s, a) => s + a.A, 0) / this.agents.length;
    }
    meanPulseRate() {
      return this.agents.reduce((s, a) => s + a.r, 0) / this.agents.length;
    }
    step() {
      if (this.done) return this.getState();
      for (const a of this.agents) {
        a.px = a.x.slice();
        a.trialPrev = a.trial ? a.trial.slice() : null;
      }
      if (this.phase === "INIT" || this.phase === "ACCEPT") {
        this.phase = "PULSE";
        this.phaseLabel = "Pulsa: terbang menuju x*";
        const best = this.bestEver.x;
        for (const a of this.agents) {
          a.freq = this.fmin + (this.fmax - this.fmin) * this.rng.next();
          a.mode = "global";
          a.accepted = null;
          a.trialPrev = a.x.slice();
          const trial = new Array(this.dim);
          for (let d = 0; d < this.dim; d++) {
            a.v[d] += (best[d] - a.x[d]) * a.freq;
            const lim = 0.3 * this.span;
            if (a.v[d] > lim) a.v[d] = lim;
            if (a.v[d] < -lim) a.v[d] = -lim;
            trial[d] = this.clamp(a.x[d] + a.v[d]);
          }
          a.trial = trial;
          a.trialF = null;
        }
        this.phaseDetail = `Frekuensi acak f \u2208 [${this.fmin}, ${this.fmax}]. Posisi percobaan = posisi + kecepatan.`;
        return this.getState();
      }
      if (this.phase === "PULSE") {
        this.phase = "LOCAL";
        this.phaseLabel = "Jelajah lokal di dekat x*";
        const best = this.bestEver.x;
        const meanA = this.meanLoudness();
        let localCount = 0;
        for (const a of this.agents) {
          if (this.rng.next() > a.r) {
            const trial = new Array(this.dim);
            for (let d = 0; d < this.dim; d++) {
              const eps = this.rng.range(-1, 1);
              trial[d] = this.clamp(best[d] + eps * meanA * this.localScale * this.span);
            }
            a.trial = trial;
            a.mode = "local";
            localCount++;
          }
        }
        for (const a of this.agents) a.trialF = this.evalFitness(a.trial);
        this.phaseDetail = `${localCount} dari ${this.agents.length} kelelawar menjelajah lokal (rand > r). \u0100 = ${meanA.toFixed(2)}, r\u0304 = ${this.meanPulseRate().toFixed(2)}.`;
        return this.getState();
      }
      this.phase = "ACCEPT";
      this.phaseLabel = "Terima atau tolak";
      this.iteration++;
      let accepted = 0;
      for (const a of this.agents) {
        const ok = this.rng.next() < a.A && a.trialF < a.f;
        a.accepted = ok;
        if (ok) {
          a.x = a.trial.slice();
          a.f = a.trialF;
          a.A *= this.alphaA;
          a.r = pulseRateAt(this.r0, this.gammaR, this.iteration);
          accepted++;
        }
      }
      this.updateBest();
      this.history.push({ iteration: this.iteration, bestFitness: this.bestEver.f });
      this.phaseDetail = `${accepted} diterima, ${this.agents.length - accepted} ditolak. Terbaik f = ${this.bestEver.f.toFixed(3)}. \u0100 = ${this.meanLoudness().toFixed(2)}, r\u0304 = ${this.meanPulseRate().toFixed(2)}.`;
      if (this.iteration >= this.maxIterations) {
        this.phase = "DONE";
        this.phaseLabel = "Selesai";
        this.done = true;
        this.phaseDetail = `Selesai setelah ${this.iteration} iterasi dan ${this.evaluations} evaluasi. Terbaik f = ${this.bestEver.f.toFixed(4)}.`;
      }
      return this.getState();
    }
    runIteration() {
      const target = this.iteration + 1;
      let guard = 0;
      while (!this.done && this.iteration < target && guard++ < 10) this.step();
      return this.getState();
    }
    getState() {
      return {
        kind: "BA",
        phase: this.phase,
        phaseLabel: this.phaseLabel,
        phaseDetail: this.phaseDetail,
        iteration: this.iteration,
        maxIterations: this.maxIterations,
        evaluations: this.evaluations,
        agents: this.agents,
        meanA: this.meanLoudness(),
        meanR: this.meanPulseRate(),
        best: this.bestEver ? { x: this.bestEver.x.slice(), fitness: this.bestEver.f } : null,
        history: this.history,
        done: this.done,
        params: {
          A0: this.A0,
          r0: this.r0,
          alphaA: this.alphaA,
          gammaR: this.gammaR,
          localRadius: this.meanLoudness() * this.localScale * this.span
        }
      };
    }
  };

  // src/algorithms/cloudScheduling.js
  var TIE_BREAK = 1e-3;
  function makeVMs(m = 4) {
    const names = ["Small", "Medium", "Large", "X-Large"];
    return Array.from({ length: m }, (_, k) => ({
      id: k,
      name: `VM-${k + 1}`,
      tier: m === 4 ? names[k] : `${85 + Math.round(90 * k / Math.max(1, m - 1))} MIPS`,
      mips: m === 1 ? 130 : Math.round(85 + 90 * k / (m - 1))
    }));
  }
  var DEFAULT_VMS = makeVMs(4);
  function generateTasks(count = 16, seed = 2026) {
    const rng = createRandom(seed);
    return Array.from({ length: count }, (_, idx) => ({
      id: idx + 1,
      name: `T${idx + 1}`,
      mi: rng.int(140, 620)
    }));
  }
  function decodeSchedule(vector, vmCount) {
    const maxIdx = vmCount - 1;
    return vector.map((val) => {
      const idx = Math.floor(val);
      return idx < 0 ? 0 : idx > maxIdx ? maxIdx : idx;
    });
  }
  function evaluateAssignment(assignment, tasks, vms = DEFAULT_VMS) {
    const vmLoads = vms.map(() => 0);
    const vmTasks = vms.map(() => []);
    for (let i = 0; i < tasks.length; i++) {
      const j = assignment[i];
      const execSec = tasks[i].mi / vms[j].mips;
      vmTasks[j].push({ ...tasks[i], execSec, start: vmLoads[j] });
      vmLoads[j] += execSec;
    }
    let makespan = 0;
    let sum = 0;
    for (const l of vmLoads) {
      if (l > makespan) makespan = l;
      sum += l;
    }
    const mean = sum / vms.length;
    let variance = 0;
    for (const l of vmLoads) variance += (l - mean) * (l - mean);
    const imbalanceStd = Math.sqrt(variance / vms.length);
    return {
      assignment,
      vmLoads,
      vmTasks,
      makespan,
      imbalanceStd,
      fitness: makespan + TIE_BREAK * imbalanceStd
    };
  }
  function evaluateSchedule(vector, tasks, vms = DEFAULT_VMS) {
    return evaluateAssignment(decodeSchedule(vector, vms.length), tasks, vms);
  }
  function idealMakespan(tasks, vms = DEFAULT_VMS) {
    const totalMI = tasks.reduce((s, t) => s + t.mi, 0);
    const totalMips = vms.reduce((s, v) => s + v.mips, 0);
    return totalMI / totalMips;
  }
  function roundRobin(tasks, vms = DEFAULT_VMS) {
    return evaluateAssignment(tasks.map((_, i) => i % vms.length), tasks, vms);
  }
  function minMin(tasks, vms = DEFAULT_VMS) {
    const ready = vms.map(() => 0);
    const assignment = new Array(tasks.length).fill(-1);
    let left = tasks.length;
    while (left > 0) {
      let bestTask = -1;
      let bestVm = -1;
      let bestCt = Infinity;
      for (let i = 0; i < tasks.length; i++) {
        if (assignment[i] >= 0) continue;
        let minCt = Infinity;
        let minVm = -1;
        for (let j = 0; j < vms.length; j++) {
          const ct = ready[j] + tasks[i].mi / vms[j].mips;
          if (ct < minCt) {
            minCt = ct;
            minVm = j;
          }
        }
        if (minCt < bestCt) {
          bestCt = minCt;
          bestTask = i;
          bestVm = minVm;
        }
      }
      assignment[bestTask] = bestVm;
      ready[bestVm] = bestCt;
      left--;
    }
    return evaluateAssignment(assignment, tasks, vms);
  }
  function sharedInitialPopulation(n, m, populationSize, seed) {
    const rng = createRandom(Number(seed));
    return Array.from(
      { length: populationSize },
      () => Array.from({ length: n }, () => rng.range(0, m - 1e-6))
    );
  }
  var CLOUD_DEFAULTS = {
    n: 16,
    m: 4,
    populationSize: 28,
    maxIterations: 40,
    seed: 42,
    workloadSeed: 2026,
    fa: { beta0: 1, gamma: 2, alpha: 0.25, alphaDecay: 0.96 },
    ba: { fmin: 0, fmax: 1.5, loudness: 1, pulseRate: 0.5, alphaA: 0.9, gammaR: 0.9, localScale: 0.1 }
  };
  var CloudScheduleOptimizer = class {
    constructor(options = {}) {
      this.configure(options);
    }
    configure(options = {}) {
      const o = { ...CLOUD_DEFAULTS, ...options };
      this.n = o.n;
      this.m = o.m;
      this.vms = makeVMs(o.m);
      this.tasks = options.tasks || generateTasks(o.n, o.workloadSeed);
      this.populationSize = o.populationSize;
      this.maxIterations = o.maxIterations;
      this.seed = o.seed;
      this.faParams = { ...CLOUD_DEFAULTS.fa, ...options.fa || {} };
      this.baParams = { ...CLOUD_DEFAULTS.ba, ...options.ba || {} };
      this.reset();
    }
    reset() {
      const tasks = this.tasks;
      const vms = this.vms;
      const fitness = (x) => evaluateSchedule(x, tasks, vms).fitness;
      const common = {
        dim: tasks.length,
        lo: 0,
        hi: vms.length - 1e-6,
        fitness,
        populationSize: this.populationSize,
        maxIterations: this.maxIterations,
        seed: this.seed,
        initial: sharedInitialPopulation(tasks.length, vms.length, this.populationSize, this.seed)
      };
      this.fa = new FAEngine({ ...common, ...this.faParams });
      this.ba = new BAEngine({ ...common, ...this.baParams });
      this.baselineRR = roundRobin(tasks, vms);
      this.baselineMinMin = minMin(tasks, vms);
      this.ideal = idealMakespan(tasks, vms);
    }
    get done() {
      return this.fa.done && this.ba.done;
    }
    step() {
      this.fa.runIteration();
      this.ba.runIteration();
      return this.getState();
    }
    run() {
      while (!this.done) this.step();
      return this.getState();
    }
    getState() {
      const fa = this.fa.getState();
      const ba = this.ba.getState();
      return {
        iteration: Math.max(fa.iteration, ba.iteration),
        maxIterations: this.maxIterations,
        fa,
        ba,
        evalFa: evaluateSchedule(fa.best.x, this.tasks, this.vms),
        evalBa: evaluateSchedule(ba.best.x, this.tasks, this.vms),
        baselineRR: this.baselineRR,
        baselineMinMin: this.baselineMinMin,
        ideal: this.ideal,
        done: this.done
      };
    }
  };
  function runWorkload(w, { n = 16, m = 4, populationSize = 28, maxIterations = 40, seed = 42 } = {}) {
    const tasks = generateTasks(n, 3e3 + w * 17);
    const opt = new CloudScheduleOptimizer({ n, m, tasks, populationSize, maxIterations, seed: seed + w });
    const st = opt.run();
    return {
      workload: w + 1,
      ideal: opt.ideal,
      rr: opt.baselineRR.makespan,
      minmin: opt.baselineMinMin.makespan,
      fa: st.evalFa.makespan,
      ba: st.evalBa.makespan
    };
  }
  function runExperiment({ workloads = 10, onWorkload, ...rest } = {}) {
    const results = [];
    for (let w = 0; w < workloads; w++) {
      const row = runWorkload(w, rest);
      results.push(row);
      if (onWorkload) onWorkload(row, results);
    }
    return results;
  }
  function summarizeExperiment(rows) {
    const avg = (key) => rows.reduce((s, r) => s + r[key], 0) / rows.length;
    const ratio = (key) => rows.reduce((s, r) => s + r[key] / r.ideal, 0) / rows.length;
    let faWins = 0;
    let baWins = 0;
    let ties = 0;
    for (const r of rows) {
      if (Math.abs(r.fa - r.ba) < 1e-9) ties++;
      else if (r.fa < r.ba) faWins++;
      else baWins++;
    }
    return {
      count: rows.length,
      avg: { rr: avg("rr"), minmin: avg("minmin"), fa: avg("fa"), ba: avg("ba"), ideal: avg("ideal") },
      ratio: { rr: ratio("rr"), minmin: ratio("minmin"), fa: ratio("fa"), ba: ratio("ba") },
      faWins,
      baWins,
      ties,
      gainFaVsRR: (1 - avg("fa") / avg("rr")) * 100,
      gainBaVsRR: (1 - avg("ba") / avg("rr")) * 100
    };
  }

  // src/slides/frame.js
  function mountStory(root, { reducedMotion, registerHooks }, spec) {
    const { tag, beats, draw, trail, extraHtml = "" } = spec;
    root.innerHTML = `
    <canvas class="cv"></canvas>
    <header class="plate">
      <span class="plate-tag"><i></i>${tag}</span>
      <h1 class="plate-title"></h1>
      <p class="plate-sub"></p>
      <div class="plate-beats" aria-hidden="true">${beats.map(() => "<b></b>").join("")}</div>
    </header>
    ${trail ? `<ol class="trail">${trail.map((t, i) => `<li><span>${i + 1}</span>${t}</li>`).join("")}</ol>` : ""}
    ${extraHtml}
  `;
    const title = root.querySelector(".plate-title");
    const sub = root.querySelector(".plate-sub");
    const dots = [...root.querySelectorAll(".plate-beats b")];
    const steps = [...root.querySelectorAll(".trail li")];
    const loop = startCanvasLoop(root.querySelector(".cv"), draw, { calm: reducedMotion });
    function setBeat(n) {
      const beat = beats[Math.min(n, beats.length - 1)];
      if (beat.html) title.innerHTML = beat.html;
      else title.textContent = beat.title;
      sub.textContent = beat.sub || "";
      for (const el of [title, sub]) {
        el.classList.remove("rise");
        void el.offsetWidth;
        el.classList.add("rise");
      }
      dots.forEach((d, i) => d.classList.toggle("on", i <= n));
      dots.forEach((d, i) => d.classList.toggle("now", i === n));
      steps.forEach((s, i) => s.classList.toggle("on", i === n));
      loop.setBeat(n);
    }
    setBeat(0);
    registerHooks?.({ setBeat });
    return () => loop.stop();
  }

  // src/render/ambient.js
  function hash01(i) {
    let h = (Math.trunc(i * 1e3) ^ 2654435769) >>> 0;
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function drift(i, t, box = { x: 80, y: 330, w: 1760, h: 640 }) {
    const home = { x: box.x + hash01(i + 3) * box.w, y: box.y + hash01(i + 40) * box.h };
    const sway = (k, base2, spread) => base2 + hash01(i + k) * spread;
    return {
      x: home.x + Math.sin(t * sway(0, 0.35, 0.45) + i) * sway(9, 40, 70),
      y: home.y + Math.cos(t * sway(5, 0.3, 0.4) + i * 2) * sway(11, 30, 55)
    };
  }

  // src/slides/chapters.js
  var CH = {
    masalah: { id: "masalah", label: "Masalah" },
    metaheuristik: { id: "metaheuristik", label: "Dasar" },
    firefly: { id: "firefly", label: "Firefly" },
    bat: { id: "bat", label: "Bat" },
    model: { id: "model", label: "Model" },
    cloud: { id: "cloud", label: "Cloud" },
    hasil: { id: "hasil", label: "Hasil" },
    penutup: { id: "penutup", label: "Penutup" }
  };
  var FA_COLOR = "#22d3ee";
  var BA_COLOR = "#a78bfa";

  // src/slides/pembukaSlides.js
  var TASKS = generateTasks(16, 2026);
  var VMS = DEFAULT_VMS;
  var RR = roundRobin(TASKS, VMS);
  var IDEAL = idealMakespan(TASKS, VMS);
  var RR_LAYOUT = layoutOf(RR);
  var TOTAL_COMBOS = Math.pow(VMS.length, TASKS.length);
  var fmtInt = (n) => n.toLocaleString("id-ID");
  function drawTitleScene(ctx, { t }) {
    drawBackdrop(ctx, t, "blue");
    for (let i = 0; i < 26; i++) {
      const cx = 120 + hash01(i + 3) * 1e3;
      const cy = 120 + hash01(i + 40) * 860;
      const x = cx + Math.sin(t * (0.4 + hash01(i) * 0.5) + i) * (50 + hash01(i + 9) * 70);
      const y = cy + Math.cos(t * (0.35 + hash01(i + 5) * 0.4) + i * 2) * (40 + hash01(i + 11) * 60);
      const blink = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + hash01(i + 17)) + i));
      drawFirefly(ctx, x, y, 12 + hash01(i + 21) * 9, { glow: blink, t });
    }
    for (let i = 0; i < 6; i++) {
      const speed = 90 + i * 22;
      const x = 2100 - (t * speed + i * 420) % 2500;
      const y = 130 + i * 110 + Math.sin(t * 1.3 + i * 2) * 40;
      drawBat(ctx, x, y, 22 + i % 3 * 5, { flap: t * 11 + i, angle: Math.sin(t + i) * 0.08 });
    }
    const loop = t % 11 / 11;
    drawSchedule(ctx, { x: 900, y: 640, w: 960, h: 300 }, TASKS, VMS, RR_LAYOUT, {
      tMax: RR.makespan * 1.08,
      laneColor: COLORS.cyan,
      labelW: 130,
      fontScale: 0.78,
      queue: { x: 760, y: 520 },
      appear: (idx) => clamp01((loop * 11 - 0.35 * idx) / 0.9) * (loop > 0.88 ? 1 - (loop - 0.88) / 0.12 : 1)
    });
  }
  var judulSlide = {
    id: "judul",
    chapter: CH.masalah,
    title: "Judul",
    notes: `
    <p>Sapa audiens. Mulai dari pertanyaan sehari-hari: kalau ada banyak pekerjaan dan beberapa komputer yang kecepatannya beda, pekerjaan mana ditaruh di komputer mana?</p>
    <p>Hari ini kita bandingkan dua jawaban dari alam: kunang-kunang (Firefly Algorithm) dan kelelawar (Bat Algorithm). Keduanya diuji pada beban kerja dan fungsi tujuan yang sama.</p>`,
    mount(container, ctx) {
      const cleanup = mountStory(container, ctx, {
        tag: "Strategi Optimasi Komputasi Awan",
        beats: [{ title: "Firefly vs Bat", html: '<span class="c-fa">Firefly</span> <span class="c-vs">vs</span> <span class="c-ba">Bat</span>', sub: "Dua algoritma terinspirasi alam untuk menjadwalkan tugas di cloud." }],
        draw: drawTitleScene
      });
      container.classList.add("hero");
      return cleanup;
    }
  };
  var QUEUE_Y = 372;
  var SCHED_RECT = { x: 110, y: 470, w: 1700, h: 470 };
  function drawProblemScene(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, "blue");
    const tMax = RR.makespan * 1.12;
    const dim = 1;
    ctx.save();
    ctx.globalAlpha = dim;
    if (beat === 0) {
      let x = 120;
      TASKS.forEach((task, i) => {
        const w = task.mi * 0.2;
        const bob = Math.sin(t * 1.6 + i) * 6;
        const enter = seg(bt, i * 0.07, 0.6, easeBack);
        ctx.save();
        ctx.globalAlpha *= clamp01(enter * 2);
        ctx.fillStyle = taskColor(task.id);
        ctx.beginPath();
        ctx.roundRect(x, QUEUE_Y + bob - (1 - enter) * 70, w, 62, 12);
        ctx.fill();
        drawText(ctx, task.name, x + w / 2, QUEUE_Y + 31 + bob - (1 - enter) * 70, { size: 26, color: COLORS.night, align: "center", weight: 800 });
        drawText(ctx, `${task.mi} MI`, x + w / 2, QUEUE_Y + 90 + bob - (1 - enter) * 70, { size: 19, color: COLORS.muted, align: "center", weight: 600, mono: true });
        ctx.restore();
        x += w + 9;
      });
      drawSchedule(ctx, SCHED_RECT, TASKS, VMS, /* @__PURE__ */ new Map(), { tMax, laneColor: COLORS.blue });
      VMS.forEach((vm, j) => {
        const laneH = (SCHED_RECT.h - 14 * 3) / 4;
        const y = SCHED_RECT.y + j * (laneH + 14);
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + j);
        drawText(ctx, `${(vm.mips / VMS[0].mips).toFixed(1)}\xD7 lebih cepat`, 1760, y + laneH / 2, {
          size: 28,
          color: COLORS.blueLight,
          align: "right",
          alpha: 0.45 + 0.4 * pulse,
          weight: 700
        });
      });
    } else if (beat === 1) {
      drawSchedule(ctx, SCHED_RECT, TASKS, VMS, RR_LAYOUT, {
        tMax,
        laneColor: COLORS.blue,
        queue: { x: 140, y: QUEUE_Y },
        appear: (idx) => clamp01((bt - 0.3 - 0.26 * idx) / 0.85),
        makespan: bt > 5.6 ? RR.makespan : null,
        ideal: bt > 6.4 ? IDEAL : null
      });
    }
    ctx.restore();
    const trackX = SCHED_RECT.x + 168;
    const trackW = SCHED_RECT.w - 168;
    const msX = trackX + RR.makespan / tMax * trackW;
    const idX = trackX + IDEAL / tMax * trackW;
    if (beat === 1) {
      if (bt > 5.6) {
        drawPill(ctx, `makespan Round-Robin ${RR.makespan.toFixed(1)} s`, msX - 20, SCHED_RECT.y - 40, {
          fill: COLORS.gold,
          size: 25,
          alpha: seg(bt, 5.6, 0.5, easeOut)
        });
      }
      if (bt > 6.4) {
        drawPill(ctx, `batas bawah ideal ${IDEAL.toFixed(1)} s`, idX - 6, SCHED_RECT.y + SCHED_RECT.h + 46, {
          fill: COLORS.lime,
          size: 25,
          alpha: seg(bt, 6.4, 0.5, easeOut)
        });
      }
    }
    if (beat === 2) drawBranchingTree(ctx, bt);
  }
  var TREE = { x0: 190, dx: 235, top: 360, bottom: 960, levels: 4 };
  var TREE_COLORS = [COLORS.cyan, COLORS.purple, COLORS.pink, COLORS.gold];
  var MS_PER_CHECK = 1;
  var DAYS_ALL = TOTAL_COMBOS * MS_PER_CHECK / 864e5;
  function treeNode(level, i) {
    const n = 4 ** level;
    return { x: TREE.x0 + level * TREE.dx, y: level === 0 ? (TREE.top + TREE.bottom) / 2 : TREE.top + (i + 0.5) * (TREE.bottom - TREE.top) / n };
  }
  function drawBranchingTree(ctx, bt) {
    for (let level = 1; level <= TREE.levels; level++) {
      const p = seg(bt, 0.2 + (level - 1) * 0.85, 0.85, easeOut);
      if (p <= 0) continue;
      const n = 4 ** level;
      const small = level >= 4;
      for (let i = 0; i < n; i++) {
        const from = treeNode(level - 1, Math.floor(i / 4));
        const to = treeNode(level, i);
        const ex = from.x + (to.x - from.x) * p;
        const ey = from.y + (to.y - from.y) * p;
        ctx.strokeStyle = hexToRgba(TREE_COLORS[i % 4], small ? 0.34 : 0.62);
        ctx.lineWidth = small ? 1 : level === 3 ? 1.6 : 2.6;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        if (!small && p > 0.9) {
          ctx.fillStyle = TREE_COLORS[i % 4];
          ctx.beginPath();
          ctx.arc(to.x, to.y, level === 1 ? 9 : level === 2 ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      drawText(ctx, `tugas ${level}`, TREE.x0 + level * TREE.dx, TREE.top - 34, { size: 24, color: COLORS.muted, align: "center", weight: 700, alpha: p });
      drawText(ctx, fmtInt(n), TREE.x0 + level * TREE.dx, TREE.bottom + 44, { size: 32, color: COLORS.gold, align: "center", mono: true, weight: 700, alpha: p });
    }
    const root = treeNode(0, 0);
    drawGlow(ctx, root.x, root.y, 46, "rgba(251,191,36,0.5)");
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(root.x, root.y, 14, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, "mulai", root.x, TREE.top - 34, { size: 24, color: COLORS.muted, align: "center", weight: 700 });
    drawText(ctx, "jadwal", root.x, TREE.bottom + 44, { size: 24, color: COLORS.muted, align: "center", weight: 700 });
    const dotsA = seg(bt, 4, 0.7, easeOut);
    if (dotsA > 0) {
      const lastX = TREE.x0 + TREE.levels * TREE.dx;
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = hexToRgba(COLORS.ink, 0.35 + 0.65 * Math.abs(Math.sin(bt * 2 + k)));
        ctx.beginPath();
        ctx.arc(lastX + 70 + k * 26, 660, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      drawText(ctx, "sampai tugas 16", lastX + 108, 710, { size: 25, color: COLORS.muted, align: "center", weight: 700, alpha: dotsA });
    }
    const cx = 1560;
    const cy = 600;
    const r = 150;
    const clockA = seg(bt, 4.4, 0.6, easeOut);
    if (clockA > 0) {
      ctx.save();
      ctx.globalAlpha *= clockA;
      ctx.lineWidth = 22;
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const sweep = seg(bt, 4.8, 3.2, easeInOut);
      ctx.strokeStyle = COLORS.coral;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sweep * 0.92);
      ctx.stroke();
      ctx.restore();
      const days = Math.round(DAYS_ALL * sweep);
      drawText(ctx, `\xB1${days}`, cx, cy - 12, { size: 84, color: COLORS.coral, align: "center", mono: true, weight: 800, alpha: clockA });
      drawText(ctx, "hari nonstop", cx, cy + 52, { size: 30, color: COLORS.ink, align: "center", weight: 700, alpha: clockA });
      drawText(ctx, "kalau tiap jadwal dicek 1 milidetik", cx, cy + r + 62, { size: 25, color: COLORS.muted, align: "center", weight: 600, alpha: clockA });
      drawText(ctx, `(tugas 16 \u2248 ${(TOTAL_COMBOS / 1e9).toFixed(1).replace(".", ",")} miliar jadwal)`, cx, cy + r + 98, { size: 22, color: COLORS.muted, align: "center", weight: 600, alpha: clockA });
    }
    const pillA = seg(bt, 8.2, 0.7, easeOut);
    if (pillA > 0) {
      drawPill(ctx, "FA dan BA di deck ini: sekitar 1.100 evaluasi", cx, 900, { fill: COLORS.lime, size: 28, alpha: pillA });
    }
  }
  var masalahSlide = {
    id: "masalah",
    chapter: CH.masalah,
    title: "Masalah penjadwalan",
    beats: 3,
    notes: `
    <p><b>Beat 1.</b> Ada 16 tugas dengan panjang berbeda (satuan MI, juta instruksi) dan 4 VM dengan kecepatan berbeda (85 sampai 175 MIPS). Waktu eksekusi satu tugas = MI dibagi MIPS.</p>
    <p><b>Beat 2.</b> Cara paling sederhana adalah Round-Robin: tugas dibagi bergiliran. Adil dari sisi jumlah, tapi tidak adil dari sisi waktu. VM paling lambat menerima jatah sama banyak, sehingga selesai paling akhir. Waktu selesai VM terakhir itulah <b>makespan</b>. Garis hijau adalah batas bawah ideal bila seluruh instruksi terbagi sempurna sesuai kecepatan VM.</p>
    <p><b>Beat 3.</b> Pohon percabangan: tiap tugas membuka empat pilihan VM, jadi jumlah jadwal naik empat kali lipat per tugas (4, 16, 64, 256, dan seterusnya sampai tugas ke-16, sekitar 4,3 miliar). Bila satu jadwal dicek dalam satu milidetik, mengecek semuanya butuh hampir 50 hari nonstop. Pengaturan bawaan FA dan BA di deck ini hanya memakai sekitar 1.100 evaluasi (28 individu \xD7 40 iterasi, ditambah evaluasi awal). Jadi kita butuh cara mencari yang cerdas. Itu pintu masuk ke metaheuristik.</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "1 \xB7 Latar belakang",
        beats: [
          { title: "16 tugas, 4 VM yang kecepatannya beda", sub: "Tugas mana ditaruh di VM mana?" },
          { title: "Bagi rata belum tentu adil", sub: "VM terlambat menentukan waktu selesai seluruh pekerjaan." },
          { title: "Terlalu banyak untuk dicoba satu per satu", sub: "Butuh pencari yang cerdas, bukan pencoba semua." }
        ],
        draw: drawProblemScene
      });
    }
  };
  var LX0 = 150;
  var LX1 = 1770;
  var L_BASE = 950;
  var L_H = 470;
  function height(u) {
    const g = (c, w) => Math.exp(-(((u - c) / w) ** 2));
    const raw = 1 - 0.5 * g(0.17, 0.065) - 0.42 * g(0.47, 0.075) - 0.9 * g(0.8, 0.06) + 0.05 * Math.sin(u * 30);
    return Math.max(0.04, raw * 0.82);
  }
  var toX = (u) => LX0 + u * (LX1 - LX0);
  var toY = (u) => L_BASE - height(u) * L_H;
  function slope(u) {
    return (height(u + 2e-3) - height(u - 2e-3)) / 4e-3;
  }
  function descend(u0, steps = 600) {
    const path = [u0];
    let u = u0;
    for (let k = 0; k < steps; k++) {
      u = Math.min(0.99, Math.max(0.01, u - 9e-4 * slope(u) * 6));
      path.push(u);
    }
    return path;
  }
  function findMin(from, to) {
    let best = from;
    for (let u = from; u <= to; u += 1e-3) if (height(u) < height(best)) best = u;
    return best;
  }
  var U_LOCAL_A = findMin(0.05, 0.3);
  var U_LOCAL_B = findMin(0.35, 0.6);
  var U_GLOBAL = findMin(0.65, 0.95);
  var HIKER_PATH = descend(0.36);
  var SWARM = Array.from({ length: 14 }, (_, i) => {
    const u0 = 0.04 + hash01(i + 70) * 0.92;
    const path = descend(u0, 240);
    return { u0, uLoc: path[path.length - 1], uFin: U_GLOBAL + (hash01(i + 120) - 0.5) * 0.05, delay: 0.12 * i };
  });
  function drawTerrain(ctx, t, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    const fill = ctx.createLinearGradient(0, L_BASE - L_H, 0, L_BASE);
    fill.addColorStop(0, "rgba(139, 92, 246, 0.55)");
    fill.addColorStop(0.5, "rgba(59, 130, 246, 0.4)");
    fill.addColorStop(1, "rgba(34, 211, 238, 0.12)");
    ctx.beginPath();
    ctx.moveTo(LX0, L_BASE + 40);
    for (let u = 0; u <= 1.0001; u += 4e-3) ctx.lineTo(toX(u), toY(u));
    ctx.lineTo(LX1, L_BASE + 40);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.beginPath();
    for (let u = 0; u <= 1.0001; u += 4e-3) {
      if (u === 0) ctx.moveTo(toX(u), toY(u));
      else ctx.lineTo(toX(u), toY(u));
    }
    ctx.strokeStyle = COLORS.cyanLight;
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
    drawText(ctx, "jadwal yang dicoba \u2192", LX1, L_BASE + 36, { size: 24, color: COLORS.muted, align: "right", weight: 600 });
    drawText(ctx, "waktu selesai \u2191", LX0 - 6, L_BASE - L_H - 32, { size: 24, color: COLORS.muted, weight: 600 });
  }
  function drawBall(ctx, u, color = COLORS.gold, r = 22, lift = 0) {
    const x = toX(u);
    const y = toY(u) - r - lift;
    drawGlow(ctx, x, y, r * 2.6, hexToRgba(color, 0.5));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawLandscapeScene(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, "purple");
    drawTerrain(ctx, t);
    drawStar(ctx, toX(U_GLOBAL), toY(U_GLOBAL) - 220, 26);
    drawPill(ctx, "terbaik sejagat", toX(U_GLOBAL), toY(U_GLOBAL) - 290, { size: 26, fill: "rgba(5,13,38,0.88)", color: COLORS.gold });
    [U_LOCAL_A, U_LOCAL_B].forEach((u) => {
      drawPill(ctx, "lembah dangkal", toX(u), toY(u) + 54, { size: 22, fill: "rgba(251,113,133,0.9)", color: COLORS.night });
    });
    if (beat === 0) {
      const idx = Math.min(HIKER_PATH.length - 1, Math.floor(bt * 70));
      const u = HIKER_PATH[idx];
      drawBall(ctx, u, COLORS.gold, 24);
      if (idx >= HIKER_PATH.length - 1 || bt > 6) {
        const a = seg(bt, 3.2, 0.6, easeOut);
        drawPill(ctx, "Terjebak! Semua arah naik, padahal ada lembah lebih dalam", toX(u), toY(u) - 120, {
          fill: COLORS.coral,
          size: 28,
          alpha: a
        });
      } else {
        drawText(ctx, "satu pencari, selalu turun", toX(0.36), toY(0.36) - 110, { size: 28, align: "center", color: COLORS.ink });
      }
    }
    if (beat === 1) {
      SWARM.forEach((a, i) => {
        const settle = seg(bt, 0, 1.8, easeInOut);
        let u = lerp(a.u0, a.uLoc, settle);
        let lift = 0;
        const hopStart = 3 + a.delay;
        if (bt > hopStart) {
          const p = seg(bt, hopStart, 1.3, easeInOut);
          u = lerp(a.uLoc, a.uFin, p);
          lift = Math.sin(Math.PI * p) * 220;
        }
        const isScout = i === 0;
        drawBall(ctx, u, isScout ? COLORS.gold : COLORS.cyan, 16, lift);
      });
      const a1 = seg(bt, 2, 0.6, easeOut);
      SWARM.slice(1, 9).forEach((a) => {
        const from = { x: toX(a.uLoc), y: toY(a.uLoc) - 40 };
        const to = { x: toX(U_GLOBAL), y: toY(U_GLOBAL) - 80 };
        if (bt < 4.5) drawArrow(ctx, from, to, { bend: 160, color: hexToRgba(COLORS.gold, 0.45), width: 3, dashed: true, progress: a1, alpha: 0.9 - seg(bt, 3.4, 1) * 0.9 });
      });
      if (bt > 1.8 && bt < 3.4) {
        drawPill(ctx, 'berbagi informasi: "di sini lebih dalam!"', toX(0.62), toY(0.62) - 330, { fill: COLORS.gold, size: 28 });
      }
    }
    if (beat === 2) {
      const phase = bt % 8 / 8;
      const explore = phase < 0.5;
      const k = explore ? phase / 0.5 : (phase - 0.5) / 0.5;
      const hops = explore ? 5 : 7;
      for (let h = 0; h < hops; h++) {
        const prog = clamp01(k * hops - h);
        if (prog <= 0) continue;
        const a = explore ? 0.12 + hash01(h + 200) * 0.76 : U_GLOBAL - 0.07 + (hash01(h + 300) - 0.5) * 0.08 + h * 0.01;
        const b = explore ? 0.12 + hash01(h + 201) * 0.76 : U_GLOBAL - 0.07 + (hash01(h + 301) - 0.5) * 0.08 + (h + 1) * 0.01;
        const from = { x: toX(a), y: toY(a) - 30 };
        const to = { x: toX(b), y: toY(b) - 30 };
        drawArrow(ctx, from, to, {
          bend: explore ? 180 : 40,
          color: explore ? COLORS.blueLight : COLORS.gold,
          width: explore ? 5 : 4,
          progress: prog,
          dashed: !explore
        });
      }
      const sx = 520;
      const sw = 880;
      const sy = 400;
      ctx.fillStyle = "rgba(242,247,255,0.14)";
      ctx.beginPath();
      ctx.roundRect(sx, sy - 9, sw, 18, 9);
      ctx.fill();
      const mark = explore ? lerp(0.05, 0.45, k) : lerp(0.55, 0.95, k);
      ctx.fillStyle = explore ? COLORS.blue : COLORS.gold;
      ctx.beginPath();
      ctx.arc(sx + sw * mark, sy, 20, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, "jelajah", sx, sy - 40, { size: 32, color: COLORS.blueLight });
      drawText(ctx, "telusuri", sx + sw, sy - 40, { size: 32, color: COLORS.gold, align: "right" });
      drawText(ctx, explore ? "Awal: lompat jauh, cari lembah baru" : "Akhir: langkah kecil, rapikan hasil", 960, sy + 52, {
        size: 32,
        align: "center",
        color: explore ? COLORS.blueLight : COLORS.gold
      });
    }
  }
  var lanskapSlide = {
    id: "lanskap",
    chapter: CH.metaheuristik,
    title: "Lanskap pencarian",
    beats: 3,
    notes: `
    <p><b>Beat 1.</b> Bayangkan setiap jadwal sebagai satu titik di pegunungan, dengan tinggi = waktu selesai. Pencari tunggal yang hanya mau turun akan berhenti di lembah terdekat. Itu optimum lokal. Lembah yang lebih dalam tidak pernah ia lihat.</p>
    <p><b>Beat 2.</b> Metaheuristik memakai banyak pencari sekaligus dan membuat mereka saling memberi kabar. Satu pencari yang beruntung menemukan lembah dalam, lalu yang lain ikut bergerak ke sana.</p>
    <p><b>Beat 3.</b> Kuncinya keseimbangan. Di awal kita jelajah luas supaya tidak terjebak. Di akhir kita telusuri teliti supaya hasilnya rapi. Firefly dan Bat mengatur keseimbangan ini dengan cara berbeda, dan itu inti perbandingan kita.</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "2 \xB7 Konsep dasar metaheuristik",
        beats: [
          { title: "Satu pencari mudah terjebak", sub: "Ia hanya turun ke lembah terdekat." },
          { title: "Banyak pencari yang saling memberi kabar", sub: "Satu menemukan lembah dalam, semua ikut." },
          { title: "Jelajah dulu, telusuri kemudian", sub: "Keseimbangan inilah yang diatur Firefly dan Bat." }
        ],
        draw: drawLandscapeScene
      });
    }
  };
  var pembukaSlides = [judulSlide, masalahSlide, lanskapSlide];

  // src/render/heatmap.js
  var TONES = {
    fa: { base: [4, 14, 40], valley: [8, 64, 112], line: [94, 234, 252], glow: [34, 211, 238] },
    ba: { base: [10, 10, 38], valley: [58, 38, 130], line: [196, 181, 253], glow: [139, 92, 246] }
  };
  var mix = (a, b, t) => a + (b - a) * t;
  var smoothstep = (e0, e1, x) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  function makeView(width, height2, landscape2, padding = 0.07) {
    const span = landscape2.max - landscape2.min;
    const scale = Math.max(1, Math.min(width, height2) * (1 - padding * 2) / span);
    const mid = (landscape2.min + landscape2.max) / 2;
    const cx = width / 2;
    const cy = height2 / 2;
    return {
      width,
      height: height2,
      scale,
      worldToScreen: (wx, wy) => ({ x: cx + (wx - mid) * scale, y: cy - (wy - mid) * scale }),
      screenToWorld: (px, py) => ({ x: mid + (px - cx) / scale, y: mid - (py - cy) / scale }),
      worldDistToPx: (d) => d * scale
    };
  }
  var _TopoMap_instances, bake_fn;
  var TopoMap = class {
    constructor() {
      __privateAdd(this, _TopoMap_instances);
      this.key = "";
      this.layer = null;
    }
    /** Menggambar peta ke ctx dan mengembalikan view-nya. Bitmap dihitung ulang hanya bila ukuran atau jenisnya berubah. */
    paint(ctx, width, height2, landscape2, tone = "fa", { padding = 0.07, showOptimum = true } = {}) {
      if (width <= 2 || height2 <= 2) return null;
      const view = makeView(width, height2, landscape2, padding);
      const key = `${width}x${height2}|${landscape2.id}|${tone}|${padding}`;
      if (key !== this.key || !this.layer) {
        this.key = key;
        this.layer = __privateMethod(this, _TopoMap_instances, bake_fn).call(this, width, height2, landscape2, tone, view);
      }
      ctx.drawImage(this.layer, 0, 0, width, height2);
      const a = view.worldToScreen(landscape2.min, landscape2.max);
      const b = view.worldToScreen(landscape2.max, landscape2.min);
      ctx.save();
      ctx.strokeStyle = "rgba(165, 243, 252, 0.28)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 7]);
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.restore();
      if (showOptimum) {
        const o = view.worldToScreen(landscape2.optimum.x, landscape2.optimum.y);
        drawStar(ctx, o.x, o.y, Math.max(9, Math.min(width, height2) * 0.021));
      }
      return view;
    }
  };
  _TopoMap_instances = new WeakSet();
  bake_fn = function(width, height2, landscape2, tone, view) {
    const palette = TONES[tone] ?? TONES.fa;
    const down = 2;
    const w = Math.max(2, Math.ceil(width / down));
    const h = Math.max(2, Math.ceil(height2 / down));
    const ceiling = landscape2.maxVisualValue || 50;
    const BANDS = 16;
    const level = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = view.screenToWorld((x + 0.5) * down, (y + 0.5) * down);
        level[y * w + x] = Math.min(1, Math.max(0, landscape2.evaluate(p.x, p.y) / ceiling)) ** 0.55;
      }
    }
    const small = document.createElement("canvas");
    small.width = w;
    small.height = h;
    const sctx = small.getContext("2d");
    const image = sctx.createImageData(w, h);
    const px = image.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const n = level[i];
        const depth = (1 - n) ** 2.2;
        let r = mix(palette.base[0], palette.valley[0], depth);
        let g = mix(palette.base[1], palette.valley[1], depth);
        let b = mix(palette.base[2], palette.valley[2], depth);
        const v = n * BANDS;
        const slope2 = Math.abs(v - level[x > 0 ? i - 1 : i] * BANDS) + Math.abs(v - level[y > 0 ? i - w : i] * BANDS) + 1e-4;
        const nearest = Math.round(v);
        const dist = Math.abs(v - nearest);
        const isIndex = nearest % 4 === 0;
        const line = 1 - smoothstep(0, (isIndex ? 1.15 : 0.7) * slope2, dist);
        if (line > 0) {
          const strength = line * (isIndex ? 0.95 : 0.5) * (0.35 + 0.65 * depth + 0.25);
          r = mix(r, palette.line[0], Math.min(1, strength));
          g = mix(g, palette.line[1], Math.min(1, strength));
          b = mix(b, palette.line[2], Math.min(1, strength));
        }
        const o2 = i * 4;
        px[o2] = r;
        px[o2 + 1] = g;
        px[o2 + 2] = b;
        px[o2 + 3] = 255;
      }
    }
    sctx.putImageData(image, 0, 0);
    const layer = document.createElement("canvas");
    layer.width = width;
    layer.height = height2;
    const lctx = layer.getContext("2d");
    lctx.imageSmoothingQuality = "high";
    lctx.drawImage(small, 0, 0, w, h, 0, 0, width, height2);
    const o = view.worldToScreen(landscape2.optimum.x, landscape2.optimum.y);
    const halo = lctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, Math.min(width, height2) * 0.28);
    halo.addColorStop(0, `rgba(${palette.glow.join(",")},0.28)`);
    halo.addColorStop(1, `rgba(${palette.glow.join(",")},0)`);
    lctx.fillStyle = halo;
    lctx.fillRect(0, 0, width, height2);
    const vignette = lctx.createRadialGradient(width / 2, height2 / 2, Math.min(width, height2) * 0.32, width / 2, height2 / 2, Math.max(width, height2) * 0.75);
    vignette.addColorStop(0, "rgba(3,8,26,0)");
    vignette.addColorStop(1, "rgba(3,8,26,0.6)");
    lctx.fillStyle = vignette;
    lctx.fillRect(0, 0, width, height2);
    return layer;
  };

  // src/render/mapRenderers.js
  var lerp3 = (a, b, t) => a + (b - a) * t;
  function worldPos(vp, from, to, alpha) {
    return vp.worldToScreen(lerp3(from[0], to[0], alpha), lerp3(from[1], to[1], alpha));
  }
  function ring(ctx, x, y, r, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  var FARenderer = class {
    constructor() {
      this.cache = new TopoMap();
    }
    render(canvas, state, objective, { alpha = 1, timestamp = 0, padding } = {}) {
      const { ctx, width, height: height2 } = fitCanvas(canvas);
      ctx.clearRect(0, 0, width, height2);
      const vp = this.cache.paint(ctx, width, height2, objective, "fa", { padding });
      if (!vp) return;
      const u = Math.min(width, height2) / 900;
      const t = timestamp / 1e3;
      const agents = state.agents;
      const pos = agents.map((a) => worldPos(vp, a.px, a.x, state.phase === "EVAL" ? 1 : alpha));
      if (state.phase === "MOVE") {
        agents.forEach((a, i) => {
          if (a.attractor < 0) return;
          const from = pos[i];
          const to = pos[a.attractor];
          ctx.strokeStyle = hexToRgba(COLORS.cyanLight, 0.15 + 0.6 * a.pull);
          ctx.lineWidth = (1 + 4 * a.pull) * u;
          ctx.setLineDash([10 * u, 7 * u]);
          ctx.lineDashOffset = -t * 40;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }
      if (state.phase === "WALK") {
        agents.forEach((a) => {
          const p0 = vp.worldToScreen(a.stepFrom[0], a.stepFrom[1]);
          const p1 = vp.worldToScreen(a.x[0], a.x[1]);
          ctx.strokeStyle = hexToRgba("#ffffff", 0.5 * (1 - alpha * 0.4));
          ctx.lineWidth = 2 * u;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        });
      }
      agents.forEach((a, i) => {
        const isBest = i === state.brightestIndex;
        drawFirefly(ctx, pos[i].x, pos[i].y, 22 * u, {
          glow: state.phase === "INIT" ? 0.5 : a.glow,
          t,
          color: isBest ? COLORS.gold : COLORS.cyan,
          core: isBest ? "#fff6d6" : "#f4fdff",
          crown: isBest && state.phase !== "INIT"
        });
      });
      if (state.best) {
        const b = vp.worldToScreen(state.best.x[0], state.best.x[1]);
        ring(ctx, b.x, b.y, 26 * u + Math.sin(t * 4) * 2 * u, hexToRgba(COLORS.gold, 0.9), 3 * u, [6 * u, 5 * u]);
        drawText(ctx, "terbaik", b.x, b.y - 40 * u, { size: 20 * u, color: COLORS.gold, align: "center" });
      }
    }
  };
  var BARenderer = class {
    constructor() {
      this.cache = new TopoMap();
    }
    render(canvas, state, objective, { alpha = 1, timestamp = 0, padding } = {}) {
      const { ctx, width, height: height2 } = fitCanvas(canvas);
      ctx.clearRect(0, 0, width, height2);
      const vp = this.cache.paint(ctx, width, height2, objective, "ba", { padding });
      if (!vp) return;
      const u = Math.min(width, height2) / 900;
      const t = timestamp / 1e3;
      const agents = state.agents;
      const phase = state.phase;
      const span = objective.max - objective.min;
      const bestPt = state.best ? vp.worldToScreen(state.best.x[0], state.best.x[1]) : null;
      if (phase === "LOCAL" && bestPt) {
        const radius = vp.worldDistToPx(state.params.localRadius ?? state.meanA * 0.1 * span);
        ring(ctx, bestPt.x, bestPt.y, radius, hexToRgba(COLORS.pink, 0.85), 3 * u, [8 * u, 6 * u]);
      }
      agents.forEach((a, i) => {
        const bat = worldPos(vp, a.px, a.x, phase === "ACCEPT" ? alpha : 1);
        if (phase === "PULSE") drawEcho(ctx, bat.x, bat.y, (alpha * 0.9 + i % 3 * 0.05) % 1, COLORS.purpleLight, 70 * u, 0.9);
        if (a.trial && (phase === "PULSE" || phase === "LOCAL" || phase === "ACCEPT")) {
          const fromTrial = a.trialPrev || a.x;
          const tp = phase === "ACCEPT" ? vp.worldToScreen(a.trial[0], a.trial[1]) : worldPos(vp, fromTrial, a.trial, alpha);
          const local = a.mode === "local";
          const col = local ? COLORS.pink : COLORS.purpleLight;
          if (phase !== "ACCEPT") {
            ctx.strokeStyle = hexToRgba(col, 0.55);
            ctx.lineWidth = 2 * u;
            ctx.setLineDash([8 * u, 7 * u]);
            ctx.beginPath();
            ctx.moveTo(bat.x, bat.y);
            ctx.lineTo(tp.x, tp.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.save();
            ctx.translate(tp.x, tp.y);
            ctx.rotate(Math.PI / 4);
            ctx.strokeStyle = col;
            ctx.lineWidth = 3 * u;
            ctx.strokeRect(-7 * u, -7 * u, 14 * u, 14 * u);
            ctx.restore();
          } else if (a.accepted) {
            drawCheck(ctx, tp.x, tp.y - 20 * u, 9 * u, COLORS.lime, 0.4 + 0.6 * alpha);
          } else {
            drawCross(ctx, tp.x, tp.y, 8 * u, COLORS.coral, 0.9 - 0.3 * alpha);
          }
        }
      });
      agents.forEach((a, i) => {
        const bat = worldPos(vp, a.px, a.x, phase === "ACCEPT" ? alpha : 1);
        const isBest = state.best && Math.abs(a.f - state.best.fitness) < 1e-12;
        drawBat(ctx, bat.x, bat.y, 18 * u, {
          flap: t * 12 + i,
          color: isBest ? "#fcd34d" : COLORS.purple,
          edge: isBest ? "#fff6d6" : COLORS.purpleLight,
          crown: isBest && phase !== "INIT",
          glow: isBest ? 1 : 0
        });
      });
      if (bestPt) {
        ring(ctx, bestPt.x, bestPt.y, 30 * u + Math.sin(t * 4) * 2 * u, hexToRgba(COLORS.gold, 0.9), 3 * u, [6 * u, 5 * u]);
        drawText(ctx, "x*", bestPt.x + 40 * u, bestPt.y + 30 * u, { size: 24 * u, color: COLORS.gold, mono: true });
      }
    }
  };

  // src/core/landscapes.js
  var TAU = Math.PI * 2;
  function landscape(id, name, bounds, visualCeiling, evaluate) {
    return {
      id,
      name,
      min: -bounds,
      max: bounds,
      maxVisualValue: visualCeiling,
      optimum: { x: 0, y: 0, value: 0 },
      evaluate
    };
  }
  var LANDSCAPES = {
    // Satu cekungan mulus: cocok untuk melihat konvergensi murni
    sphere: landscape("sphere", "Sphere", 5.12, 52, (x, y) => x * x + y * y),
    // Kisi lembah lokal: ujian untuk kemampuan menjelajah
    rastrigin: landscape(
      "rastrigin",
      "Rastrigin",
      5.12,
      82,
      (x, y) => 20 + x * x + y * y - 10 * (Math.cos(TAU * x) + Math.cos(TAU * y))
    ),
    // Riak halus dengan lubang tajam di tengah
    ackley: landscape("ackley", "Ackley", 5, 22.5, (x, y) => {
      const radial = Math.sqrt((x * x + y * y) / 2);
      const wave = (Math.cos(TAU * x) + Math.cos(TAU * y)) / 2;
      const value = 20 + Math.E - 20 * Math.exp(-0.2 * radial) - Math.exp(wave);
      return value < 1e-14 ? 0 : value;
    })
  };
  function landscapeById(id) {
    return LANDSCAPES[id] ?? LANDSCAPES.sphere;
  }

  // src/core/ticker.js
  var smooth = (p) => 1 - (1 - p) ** 3;
  var _StepTicker_instances, markTick_fn, _loop;
  var StepTicker = class {
    /**
     * @param {object} o
     * @param {() => boolean} o.onTick   menjalankan satu langkah, mengembalikan true bila algoritma selesai
     * @param {(glide:number, nowMs:number) => void} o.onFrame  menggambar satu frame
     * @param {number} [o.rate]          langkah per detik saat berjalan
     * @param {boolean} [o.calm]         true bila pengguna meminta gerakan dikurangi
     */
    constructor({ onTick, onFrame, rate = 2.5, calm = false }) {
      __privateAdd(this, _StepTicker_instances);
      __privateAdd(this, _loop, (now) => {
        const gap = this.lastNow ? now - this.lastNow : 0;
        this.lastNow = now;
        if (this.running) {
          this.carry += gap;
          const every = 1e3 / this.rate;
          if (this.carry >= every) {
            this.carry %= every;
            __privateMethod(this, _StepTicker_instances, markTick_fn).call(this, now, this.glideLen);
            if (this.onTick()) this.halt();
          }
        }
        const progress = this.glideMs <= 2 ? 1 : Math.min(1, Math.max(0, (now - this.glideFrom) / this.glideMs));
        this.onFrame(smooth(progress), now);
        this.frameId = requestAnimationFrame(__privateGet(this, _loop));
      });
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
      this.glideLen = this.calm ? 1 : Math.min(520, Math.max(60, 1e3 / this.rate * 0.78));
      if (this.running) this.glideMs = this.glideLen;
    }
    /** Mulai menggambar (dan menjalankan langkah bila sedang berjalan). Aman dipanggil berulang. */
    attach() {
      if (!this.frameId) this.frameId = requestAnimationFrame(__privateGet(this, _loop));
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.carry = 1e9;
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
      __privateMethod(this, _StepTicker_instances, markTick_fn).call(this, performance.now(), this.calm ? 1 : 420);
      this.onTick();
      this.attach();
    }
    /** Dipanggil setelah mesin dikembalikan ke awal: gambar langsung melompat tanpa meluncur. */
    settle() {
      this.halt();
      __privateMethod(this, _StepTicker_instances, markTick_fn).call(this, performance.now(), 1);
      this.attach();
    }
    dispose() {
      this.running = false;
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
  };
  _StepTicker_instances = new WeakSet();
  markTick_fn = function(now, duration) {
    this.glideFrom = now;
    this.glideMs = duration;
  };
  _loop = new WeakMap();

  // src/render/chart.js
  function formatTick(val) {
    if (val === 0) return "0";
    if (val >= 100) return val.toFixed(0);
    if (val >= 10) return val.toFixed(0);
    if (val >= 1) return val.toFixed(1);
    if (val >= 0.1) return val.toFixed(2);
    return val.toExponential(0);
  }
  function renderConvergenceChart(canvas, seriesList, options = {}) {
    if (!canvas) return;
    const { ctx, width, height: height2 } = fitCanvas(canvas);
    ctx.clearRect(0, 0, width, height2);
    const u = Math.max(0.55, Math.min(1.5, Math.min(width / 610, height2 / 220)));
    const padLeft = 64 * u;
    const padRight = 70 * u;
    const hasLegend = options.legend !== false && seriesList.length > 1;
    const padTop = (hasLegend ? 50 : 22) * u;
    const padBottom = 34 * u;
    const plotW = Math.max(20, width - padLeft - padRight);
    const plotH = Math.max(20, height2 - padTop - padBottom);
    let maxIter = Math.max(10, options.maxIterations || 20);
    let maxVal = 0;
    let minVal = Infinity;
    for (const s of seriesList) {
      for (const pt of s.data) {
        if (pt.iteration > maxIter) maxIter = pt.iteration;
        if (pt.bestFitness > maxVal) maxVal = pt.bestFitness;
        if (pt.bestFitness < minVal) minVal = pt.bestFitness;
      }
    }
    const yMin = options.yMin ?? 0;
    const yTop = options.yMax ?? (maxVal <= yMin + 1e-6 ? yMin + 1 : yMin + (maxVal - yMin) * 1.08);
    const ySpan = Math.max(1e-9, yTop - yMin);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(169, 187, 214, 0.2)";
    ctx.font = `600 ${16 * u}px "Red Hat Mono", "Manrope", monospace`;
    ctx.fillStyle = "#a9bbd6";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 2; i++) {
      const ratio = i / 2;
      const py = padTop + plotH - ratio * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(padLeft + plotW, py);
      ctx.stroke();
      ctx.fillText(formatTick(yMin + ratio * ySpan), padLeft - 10 * u, py);
    }
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
      const iterVal = Math.round(i / 4 * maxIter);
      ctx.fillText(`${iterVal}`, padLeft + iterVal / maxIter * plotW, padTop + plotH + 19 * u);
    }
    const labels = [];
    for (const s of seriesList) {
      if (!s.data || s.data.length === 0) continue;
      const color = s.color || "#22d3ee";
      const points = s.data.map((pt) => ({
        px: padLeft + pt.iteration / maxIter * plotW,
        py: padTop + plotH - Math.max(0, Math.min(1, (pt.bestFitness - yMin) / ySpan)) * plotH
      }));
      if (seriesList.length === 1 && points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].px, padTop + plotH);
        points.forEach((p) => ctx.lineTo(p.px, p.py));
        ctx.lineTo(points[points.length - 1].px, padTop + plotH);
        ctx.closePath();
        ctx.fillStyle = s.fill || "rgba(34, 211, 238, 0.16)";
        ctx.fill();
      }
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = s.dashed ? 0 : 10 * u;
      if (s.dashed) ctx.setLineDash([10 * u, 8 * u]);
      ctx.beginPath();
      points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = (s.width || 3.4) * u;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
      const last = points[points.length - 1];
      if (!s.dashed) {
        ctx.beginPath();
        ctx.arc(last.px, last.py, 6 * u, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      labels.push({ y: last.py, x: last.px, color, text: s.data[s.data.length - 1].bestFitness });
    }
    labels.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labels.length; i++) {
      if (labels[i].y - labels[i - 1].y < 20 * u) labels[i].y = labels[i - 1].y + 20 * u;
    }
    ctx.textAlign = "left";
    ctx.font = `700 ${17 * u}px "Red Hat Mono", "Manrope", monospace`;
    const dec = options.decimals ?? 2;
    for (const l of labels) {
      ctx.fillStyle = l.color;
      ctx.fillText(l.text.toFixed(dec), Math.min(l.x + 12 * u, width - padRight + 6 * u), l.y);
    }
    if (hasLegend) {
      ctx.font = `700 ${18 * u}px "Manrope", sans-serif`;
      let lx = padLeft + 12 * u;
      for (const s of seriesList) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(lx, 20 * u, 6 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f2f7ff";
        ctx.textAlign = "left";
        ctx.fillText(s.label, lx + 14 * u, 20 * u);
        lx += ctx.measureText(s.label).width + 52 * u;
      }
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // src/slides/console.js
  var OBJECTIVE_BUTTONS = [
    { id: "rastrigin", label: "Rastrigin" },
    { id: "ackley", label: "Ackley" },
    { id: "sphere", label: "Sphere" }
  ];
  var ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3.2"/></svg>',
    step: '<svg viewBox="0 0 24 24"><path d="M5 5v14l9-7zM18 5v14" /></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
  };
  function formatFitness(value) {
    return value < 1e-3 && value > 0 ? value.toExponential(2) : value.toFixed(3);
  }
  function objectiveButtonsHtml(activeId) {
    return OBJECTIVE_BUTTONS.map(
      (o) => `<button type="button" class="seg-btn${o.id === activeId ? " active" : ""}" data-obj="${o.id}">${o.label}</button>`
    ).join("");
  }
  function paramsHtml(id, params) {
    return params.map(
      (p) => `
      <label class="knob" for="${id}-p-${p.key}">
        <span class="knob-top">${p.label}<b id="${id}-v-${p.key}">${p.value}</b></span>
        <input type="range" id="${id}-p-${p.key}" data-param="${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}" />
      </label>`
    ).join("");
  }
  var dockButton = (id, icon, label, extra = "") => `<button type="button" class="dock-btn ${extra}" id="${id}">${icon}<span>${label}</span></button>`;
  function drawerHtml(id, params, speed) {
    return `
    <aside class="drawer hidden" id="${id}-params" aria-label="Parameter">
      <header><h3>Parameter</h3><button type="button" class="drawer-x" id="${id}-params-close" aria-label="Tutup parameter">&times;</button></header>
      <div class="drawer-body">
        ${paramsHtml(id, params)}
        <label class="knob" for="${id}-speed">
          <span class="knob-top">Kecepatan<b id="${id}-v-speed">${speed}</b></span>
          <input type="range" id="${id}-speed" min="0.5" max="14" step="0.5" value="${speed}" />
        </label>
        <label class="knob" for="${id}-seed">
          <span class="knob-top">Seed acak</span>
          <input type="number" class="num" id="${id}-seed" value="42" min="1" max="99999" />
        </label>
      </div>
    </aside>`;
  }
  function wireDrawer(root, id) {
    const drawer = root.querySelector(`#${id}-params`);
    const opener = root.querySelector(`#${id}-params-toggle`);
    const set = (open) => {
      drawer.classList.toggle("hidden", !open);
      opener.setAttribute("aria-expanded", String(open));
    };
    opener.addEventListener("click", () => set(drawer.classList.contains("hidden")));
    root.querySelector(`#${id}-params-close`).addEventListener("click", () => set(false));
    return set;
  }
  function setPlayLabel(button, playing) {
    button.querySelector("span").textContent = playing ? "Jeda" : "Mulai";
    button.innerHTML = (playing ? ICONS.pause : ICONS.play) + `<span>${playing ? "Jeda" : "Mulai"}</span>`;
    button.classList.toggle("is-playing", playing);
  }
  function mountConsole(root, { reducedMotion, registerHooks }, spec) {
    const { idPrefix: id, title, tag, color, createEngine, renderer, phases, params } = spec;
    const MAX_ITER = spec.maxIterations ?? 30;
    const START_RATE = spec.speed ?? 3;
    root.innerHTML = `
    <div class="con" style="--tone:${color}">
      <canvas class="con-map" id="${id}-canvas"></canvas>

      <header class="plate plate-compact">
        <span class="plate-tag"><i></i>${tag}</span>
        <h1 class="plate-title">${title}</h1>
      </header>

      <section class="hud hud-phases">
        <small>Tahap algoritma</small>
        <ol>${phases.map((p, i) => `<li data-phase="${p.key}"><span>${i + 1}</span>${p.label}</li>`).join("")}</ol>
        <p id="${id}-detail"></p>
      </section>

      <section class="hud hud-best">
        <div><small>Terbaik f(x)</small><strong id="${id}-best"></strong></div>
        <div class="ring" id="${id}-ring"><em id="${id}-iter"></em></div>
      </section>

      <section class="hud hud-chart"><small>Konvergensi</small><canvas id="${id}-chart"></canvas></section>

      <div class="dock">
        ${dockButton(`${id}-play`, ICONS.play, "Mulai", "dock-main")}
        ${dockButton(`${id}-step`, ICONS.step, "Langkah")}
        ${dockButton(`${id}-reset`, ICONS.reset, "Reset")}
        <i class="dock-sep"></i>
        <div class="seg" id="${id}-objectives">${objectiveButtonsHtml("rastrigin")}</div>
        <i class="dock-sep"></i>
        ${dockButton(`${id}-params-toggle`, ICONS.gear, "Parameter")}
      </div>

      ${drawerHtml(id, params, START_RATE)}
    </div>`;
    const $2 = (sel) => root.querySelector(sel);
    const mapCanvas = $2(`#${id}-canvas`);
    const chartCanvas = $2(`#${id}-chart`);
    const playBtn = $2(`#${id}-play`);
    const speedInput = $2(`#${id}-speed`);
    const seedInput = $2(`#${id}-seed`);
    const knobs = [...root.querySelectorAll("[data-param]")];
    const phaseItems = [...root.querySelectorAll(".hud-phases li")];
    const objectiveBtns = [...root.querySelectorAll(`#${id}-objectives .seg-btn`)];
    wireDrawer(root, id);
    let landscape2 = landscapeById("rastrigin");
    let rate = START_RATE;
    const readConfig = () => {
      const cfg = { objective: landscape2, maxIterations: MAX_ITER, seed: Number(seedInput.value) || 42 };
      for (const k of knobs) cfg[k.dataset.param] = Number(k.value);
      return cfg;
    };
    let engine = createEngine(readConfig());
    function showState(state) {
      phaseItems.forEach((li) => li.classList.toggle("active", li.dataset.phase === state.phase));
      $2(`#${id}-detail`).textContent = state.phaseDetail;
      $2(`#${id}-best`).textContent = formatFitness(state.best.fitness);
      $2(`#${id}-iter`).textContent = `${state.iteration}/${state.maxIterations}`;
      $2(`#${id}-ring`).style.setProperty("--p", String(state.iteration / state.maxIterations));
      renderConvergenceChart(chartCanvas, [{ label: title, color, data: state.history }], {
        maxIterations: state.maxIterations,
        decimals: 3
      });
    }
    const ticker = new StepTicker({
      rate,
      calm: reducedMotion,
      onTick: () => {
        const state = engine.step();
        showState(state);
        return state.phase === "DONE";
      },
      onFrame: (glide, now) => {
        renderer.render(mapCanvas, engine.getState(), landscape2, { alpha: glide, timestamp: reducedMotion ? 0 : now, padding: 0.13 });
      }
    });
    ticker.onRunningChange = (on) => setPlayLabel(playBtn, on);
    const finished = () => engine.getState().phase === "DONE";
    const reset = () => {
      engine.reset();
      showState(engine.getState());
      ticker.settle();
      ticker.setRate(rate);
    };
    const rebuild = () => {
      ticker.halt();
      engine = createEngine(readConfig());
      showState(engine.getState());
      ticker.settle();
      ticker.setRate(rate);
    };
    const toggle = () => {
      if (finished()) reset();
      ticker.setRate(rate);
      ticker.toggle();
    };
    const step = () => {
      if (finished()) return;
      ticker.single();
      ticker.setRate(rate);
    };
    playBtn.addEventListener("click", toggle);
    $2(`#${id}-step`).addEventListener("click", step);
    $2(`#${id}-reset`).addEventListener("click", reset);
    objectiveBtns.forEach(
      (btn) => btn.addEventListener("click", () => {
        objectiveBtns.forEach((b) => b.classList.toggle("active", b === btn));
        landscape2 = landscapeById(btn.dataset.obj);
        rebuild();
      })
    );
    knobs.forEach(
      (k) => k.addEventListener("input", () => {
        $2(`#${id}-v-${k.dataset.param}`).textContent = k.value;
        rebuild();
      })
    );
    speedInput.addEventListener("input", () => {
      rate = Number(speedInput.value);
      $2(`#${id}-v-speed`).textContent = speedInput.value;
      ticker.setRate(rate);
    });
    seedInput.addEventListener("change", rebuild);
    registerHooks?.({ togglePlay: toggle, step, reset });
    const onResize = () => showState(engine.getState());
    addEventListener("resize", onResize);
    showState(engine.getState());
    ticker.attach();
    return () => {
      removeEventListener("resize", onResize);
      ticker.dispose();
    };
  }

  // src/slides/lab.js
  var LAB_W = 1720;
  var LAB_H = 620;
  function mountLab(root, { reducedMotion, registerHooks }, spec) {
    const defaults = Object.fromEntries(spec.sliders.map((s) => [s.key, s.value]));
    const params = { ...defaults };
    const pointer = { x: null, y: null, active: false };
    root.innerHTML = `
    <div class="labx" style="--tone:${spec.color}">
      <header class="plate">
        <span class="plate-tag"><i></i>${spec.tag}</span>
        <h1 class="plate-title">${spec.title}</h1>
        <p class="plate-sub">${spec.intro}</p>
      </header>
      <canvas class="labx-cv" id="lab-canvas"></canvas>
      <div class="faders">
        ${spec.sliders.map(
      (s) => `
          <label class="fader" for="lab-${s.key}">
            <span class="knob-top">${s.label}<b id="lab-v-${s.key}">${s.value}</b></span>
            <input type="range" id="lab-${s.key}" data-key="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" />
            <span class="fader-note">${s.desc}</span>
          </label>`
    ).join("")}
        <button type="button" class="fader-reset" id="lab-reset" title="Kembalikan nilai bawaan (R)">${ICONS.reset}<span>Bawaan</span></button>
      </div>
    </div>`;
    const canvas = root.querySelector("#lab-canvas");
    const inputs = [...root.querySelectorAll("input[type=range]")];
    const show = (key) => root.querySelector(`#lab-v-${key}`).textContent = params[key];
    inputs.forEach(
      (input) => input.addEventListener("input", () => {
        params[input.dataset.key] = Number(input.value);
        show(input.dataset.key);
      })
    );
    const reset = () => {
      Object.assign(params, defaults);
      inputs.forEach((input) => {
        input.value = params[input.dataset.key];
        show(input.dataset.key);
      });
    };
    root.querySelector("#lab-reset").addEventListener("click", reset);
    registerHooks?.({ reset });
    canvas.addEventListener("pointermove", (e) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - box.left) / box.width * LAB_W;
      pointer.y = (e.clientY - box.top) / box.height * LAB_H;
      pointer.active = true;
    });
    canvas.addEventListener("pointerleave", () => pointer.active = false);
    const loop = startCanvasLoop(canvas, (c, frame) => spec.draw(c, frame, params, pointer), {
      calm: reducedMotion,
      width: LAB_W,
      height: LAB_H
    });
    return () => loop.stop();
  }

  // src/slides/faSlides.js
  var FOOD = { x: 1480, y: 700 };
  var N_FLY = 22;
  var BOX = { x: 120, y: 340, w: 1700, h: 600 };
  function quality(p) {
    const d = Math.hypot(p.x - FOOD.x, p.y - FOOD.y);
    return Math.exp(-((d / 520) ** 2));
  }
  function drawMeadow(ctx, t) {
    ctx.fillStyle = "#04122c";
    ctx.beginPath();
    ctx.moveTo(0, 1080);
    for (let x = 0; x <= 1920; x += 40) ctx.lineTo(x, 985 + Math.sin(x * 4e-3) * 26 + Math.sin(x * 0.011) * 10);
    ctx.lineTo(1920, 1080);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#06204a";
    ctx.lineWidth = 4;
    for (let i = 0; i < 90; i++) {
      const x = hash01(i + 600) * 1920;
      const h = 40 + hash01(i + 700) * 70;
      const sway = Math.sin(t * 1.1 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(x, 1010);
      ctx.quadraticCurveTo(x + sway * 0.4, 1010 - h * 0.6, x + sway, 1010 - h);
      ctx.stroke();
    }
  }
  function makeInspirationDraw() {
    const phys = { active: false, flies: [] };
    return function draw(ctx, { t, bt, dt, beat }) {
      drawBackdrop(ctx, t, "cyan");
      drawMeadow(ctx, t);
      const showFood = beat >= 1;
      if (showFood) {
        const a = beat === 1 ? seg(bt, 0, 0.8, easeOut) : 1;
        drawStar(ctx, FOOD.x, FOOD.y - 10, 30, { alpha: a });
        drawPill(ctx, "tempat terbaik", FOOD.x - 380, FOOD.y - 10, { size: 26, fill: "rgba(5,13,38,0.88)", color: COLORS.gold, alpha: a });
      }
      if (beat === 2 && !phys.active) {
        phys.active = true;
        phys.flies = Array.from({ length: N_FLY }, (_, i) => {
          const p = drift(i, t, BOX);
          return { x: p.x, y: p.y, vx: 0, vy: 0 };
        });
      }
      if (beat < 2) phys.active = false;
      let flies;
      if (phys.active) {
        const step = Math.min(dt, 0.05);
        const snap = phys.flies.map((f) => ({ x: f.x, y: f.y, q: quality(f) }));
        phys.flies.forEach((f, i) => {
          let ax = 0;
          let ay = 0;
          let brighter = 0;
          let sx = 0;
          let sy = 0;
          snap.forEach((o, j) => {
            if (j === i) return;
            const d = Math.hypot(o.x - f.x, o.y - f.y) || 1;
            if (o.q > snap[i].q) {
              const r = d / 1800;
              const beta = Math.exp(-4 * r * r);
              ax += beta * (o.x - f.x);
              ay += beta * (o.y - f.y);
              brighter++;
            }
            if (d < 90) {
              sx += (f.x - o.x) / d * (90 - d);
              sy += (f.y - o.y) / d * (90 - d);
            }
          });
          if (brighter > 0) {
            ax /= brighter;
            ay /= brighter;
          }
          f.vx = f.vx * 0.9 + (ax * 0.25 + sx * 0.6) * step + (hash01(i * 3 + Math.floor(t * 4)) - 0.5) * 140 * step;
          f.vy = f.vy * 0.9 + (ay * 0.25 + sy * 0.6) * step + (hash01(i * 5 + Math.floor(t * 4)) - 0.5) * 140 * step;
          f.x = Math.min(1840, Math.max(80, f.x + f.vx));
          f.y = Math.min(895, Math.max(330, f.y + f.vy));
        });
        flies = phys.flies.map((f) => ({ x: f.x, y: f.y }));
        flies.forEach((f, i) => {
          const qi = quality(f);
          const better = flies.map((o, j) => ({ o, j, q: quality(o), d: Math.hypot(o.x - f.x, o.y - f.y) })).filter((c) => c.q > qi + 0.04 && c.d > 40).sort((a, b) => a.d - b.d).slice(0, 1);
          better.forEach((c) => {
            ctx.strokeStyle = hexToRgba(COLORS.cyanLight, 0.22);
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(c.o.x, c.o.y);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        });
      } else {
        flies = Array.from({ length: N_FLY }, (_, i) => drift(i, t, BOX));
      }
      flies.forEach((p, i) => {
        const blink = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.7 + hash01(i + 17)) + i));
        const q = quality(p);
        let glow = blink;
        if (beat >= 1) glow = lerp(blink, 0.1 + 0.9 * q, beat === 1 ? seg(bt, 0.2, 1.2) : 1);
        drawFirefly(ctx, p.x, p.y, 17, { glow, t, color: beat >= 1 && q > 0.7 ? COLORS.gold : COLORS.cyan, core: beat >= 1 && q > 0.7 ? "#fff6d6" : "#f4fdff" });
      });
      if (beat === 1) {
        const a = seg(bt, 1, 0.7, easeOut);
        drawPill(ctx, "terang = solusi bagus", 460, 955, { fill: COLORS.cyan, size: 30, alpha: a });
        drawPill(ctx, "redup = solusi kurang bagus", 880, 955, { fill: "rgba(165,243,252,0.28)", color: COLORS.ink, size: 30, alpha: a });
      }
      if (beat === 2) {
        const a = seg(bt, 0.4, 0.7, easeOut);
        drawPill(ctx, "yang redup terbang ke yang lebih terang", 960, 955, { fill: COLORS.cyan, size: 30, alpha: a });
      }
    };
  }
  var faInspirasi = {
    id: "fa-inspirasi",
    chapter: CH.firefly,
    title: "Firefly: inspirasi",
    beats: 3,
    notes: `
    <p><b>Beat 1.</b> Kunang-kunang menyala untuk menarik pasangan dan mangsa. Setiap kunang-kunang adalah satu kandidat jadwal.</p>
    <p><b>Beat 2.</b> Aturan pertama: cahaya adalah kualitas solusi. Semakin bagus jadwalnya (makespan makin kecil), semakin terang nyalanya.</p>
    <p><b>Beat 3.</b> Aturan kedua: kunang-kunang yang lebih redup terbang mendekati yang lebih terang. Semakin jauh jaraknya, semakin lemah tarikannya karena cahaya meredup di udara. Itulah dua aturan inti Firefly Algorithm (Yang, 2009).</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "3 \xB7 Firefly Algorithm",
        beats: [
          { title: "Kunang-kunang menyala untuk saling memanggil", sub: "Tiap kunang-kunang adalah satu kandidat jadwal." },
          { title: "Makin terang, makin bagus solusinya", sub: "Kecerahan mewakili kualitas, bukan sekadar hiasan." },
          { title: "Yang redup mengejar yang terang", sub: "Makin jauh, makin lemah tarikannya." }
        ],
        draw: makeInspirationDraw()
      });
    }
  };
  function drawFaCharacter(ctx, { t }, p, pointer) {
    ctx.clearRect(0, 0, LAB_W, LAB_H);
    drawBackdrop(ctx, t, "cyan", LAB_W, LAB_H);
    const px = 110;
    const py = 120;
    const pw = 820;
    const ph = 330;
    const yOf = (b) => py + ph - b / 1.5 * ph;
    const xOf = (r2) => px + r2 * pw;
    drawText(ctx, "Daya tarik \u03B2 menurun seiring jarak r", px, 38, { size: 32, color: COLORS.ink });
    drawText(ctx, "Gerakkan kursor di grafik untuk memilih jarak", px, 78, { size: 22, color: COLORS.muted, weight: 600 });
    ctx.strokeStyle = "rgba(169,187,214,0.25)";
    ctx.lineWidth = 2;
    [0, 0.5, 1, 1.5].forEach((b) => {
      ctx.beginPath();
      ctx.moveTo(px, yOf(b));
      ctx.lineTo(px + pw, yOf(b));
      ctx.stroke();
      drawText(ctx, b.toFixed(1), px - 14, yOf(b), { size: 21, color: COLORS.muted, align: "right", mono: true, weight: 600 });
    });
    [0, 0.25, 0.5, 0.75, 1].forEach((r2) => {
      drawText(ctx, r2.toFixed(2), xOf(r2), py + ph + 28, { size: 21, color: COLORS.muted, align: "center", mono: true, weight: 600 });
    });
    drawText(ctx, "jarak ternormalisasi r", px + pw / 2, py + ph + 66, { size: 23, color: COLORS.muted, align: "center", weight: 600 });
    const curve = new Path2D();
    for (let i = 0; i <= 120; i++) {
      const r2 = i / 120;
      const b = attractiveness(p.beta0, p.gamma, r2);
      if (i === 0) curve.moveTo(xOf(r2), yOf(b));
      else curve.lineTo(xOf(r2), yOf(b));
    }
    const area = new Path2D();
    area.addPath(curve);
    area.lineTo(xOf(1), yOf(0));
    area.lineTo(xOf(0), yOf(0));
    area.closePath();
    const fade = ctx.createLinearGradient(0, py, 0, py + ph);
    fade.addColorStop(0, "rgba(34,211,238,0.5)");
    fade.addColorStop(1, "rgba(34,211,238,0.04)");
    ctx.fillStyle = fade;
    ctx.fill(area);
    ctx.save();
    ctx.shadowColor = FA_COLOR;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = FA_COLOR;
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.stroke(curve);
    ctx.restore();
    const overChart = pointer.active && pointer.x > px && pointer.x < px + pw && pointer.y > py - 40 && pointer.y < py + ph + 80;
    const r = overChart ? clamp01((pointer.x - px) / pw) : 0.5 - 0.5 * Math.cos(t * 0.55);
    const beta = attractiveness(p.beta0, p.gamma, r);
    ctx.strokeStyle = hexToRgba(COLORS.gold, 0.8);
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(xOf(r), yOf(0));
    ctx.lineTo(xOf(r), yOf(beta));
    ctx.stroke();
    ctx.setLineDash([]);
    drawGlow(ctx, xOf(r), yOf(beta), 34, "rgba(251,191,36,0.6)");
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(xOf(r), yOf(beta), 11, 0, Math.PI * 2);
    ctx.fill();
    drawPill(ctx, `r = ${r.toFixed(2)}  \u2192  \u03B2 = ${beta.toFixed(2)}`, Math.min(px + pw - 150, Math.max(px + 150, xOf(r))), yOf(beta) - 52, { size: 23, fill: COLORS.gold, mono: true });
    const dx = 1010;
    const dy = 300;
    const worldW = 560;
    const left = dx + 70;
    drawText(ctx, "Yang redup bergerak sejauh  \u03B2 \xD7 jarak", dx, 38, { size: 30, color: COLORS.ink });
    const bright = { x: left, y: dy };
    const dim = { x: left + r * worldW, y: dy };
    const landing = { x: dim.x + (bright.x - dim.x) * beta, y: dy };
    drawArrow(ctx, { x: dim.x, y: dy + 62 }, { x: landing.x, y: dy + 62 }, { color: COLORS.cyanLight, width: 6, bend: 0 });
    if (p.alpha > 5e-3) {
      ctx.save();
      ctx.strokeStyle = hexToRgba("#ffffff", 0.6);
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(landing.x, landing.y, 28 + p.alpha * 140, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawText(ctx, "acak \xB1 \u03B1", landing.x, landing.y - 42 - p.alpha * 140, { size: 21, color: COLORS.muted, align: "center", weight: 600 });
    }
    ctx.save();
    ctx.globalAlpha = 0.45;
    drawFirefly(ctx, dim.x, dim.y, 24, { glow: 0.22, t });
    ctx.restore();
    drawFirefly(ctx, landing.x, landing.y, 24, { glow: 0.5, t });
    drawFirefly(ctx, bright.x, bright.y, 28, { glow: 1, t, color: COLORS.gold, core: "#fff6d6", crown: true });
    drawText(ctx, "terang", bright.x, dy + 106, { size: 25, color: COLORS.gold, align: "center" });
    drawText(ctx, "redup (awal)", dim.x, dy - 58, { size: 23, color: COLORS.muted, align: "center" });
    drawText(ctx, "posisi baru", landing.x, dy + 150, { size: 23, color: COLORS.cyanLight, align: "center" });
    drawText(ctx, beta > 0.8 ? "dekat: hampir menempel" : beta > 0.35 ? "sedang: separuh jalan" : "jauh: nyaris tidak bergeser", dx, 520, {
      size: 30,
      color: COLORS.cyanLight
    });
  }
  var faKarakter = {
    id: "fa-karakter",
    chapter: CH.firefly,
    title: "Firefly: tiga tombol pengatur",
    notes: `
    <p>Slide ini boleh dimainkan langsung. Geser slider dan lihat kurva berubah.</p>
    <ul>
      <li><b>\u03B2\u2080</b>: daya tarik saat dua kunang-kunang berdekatan. Besar berarti langsung menempel.</li>
      <li><b>\u03B3</b>: peredam jarak. \u03B3 kecil, tarikan terasa dari jauh (satu kelompok besar). \u03B3 besar, tarikan hanya terasa dari dekat (banyak kelompok kecil, lebih menjelajah).</li>
      <li><b>\u03B1</b>: lebar langkah acak. Besar berarti banyak jelajah, kecil berarti hasil rapi. Nilainya menyusut tiap iterasi dalam simulasi.</li>
    </ul>
    <p>Jarak r di sini dinormalkan ke 0 sampai 1 (lebar ruang pencarian), jadi \u03B3 berarti sama di peta 2D maupun jadwal 16 tugas.</p>`,
    mount(container, ctx) {
      return mountLab(container, ctx, {
        tag: "3 \xB7 Firefly Algorithm",
        title: "Tiga tombol pengatur",
        color: FA_COLOR,
        intro: "Coba geser. Kurva dan peragaan gerak langsung ikut berubah.",
        sliders: [
          { key: "beta0", label: "\u03B2\u2080 daya tarik dasar", min: 0.2, max: 1.5, step: 0.05, value: 1, desc: "Seberapa kuat tarikan saat jarak nol." },
          { key: "gamma", label: "\u03B3 peredam jarak", min: 0, max: 10, step: 0.1, value: 2, desc: "Makin besar, makin cepat tarikan lenyap oleh jarak." },
          { key: "alpha", label: "\u03B1 langkah acak", min: 0, max: 0.6, step: 0.01, value: 0.25, desc: "Lebar jelajah acak setelah terbang." }
        ],
        draw: drawFaCharacter
      });
    }
  };
  var PANEL = { x: 640, y: 330, w: 1240, h: 660 };
  var SPHERE = landscapeById("sphere");
  var DEMO_GAMMA = 2;
  var DEMO_SPAN = SPHERE.max - SPHERE.min;
  var DEMO_FLIES = [
    { x: -3.8, y: 2.9 },
    { x: -2.2, y: -3 },
    { x: 3.4, y: 3.1 },
    { x: 1.6, y: -1 },
    { x: -0.8, y: 1.9 },
    { x: 3.2, y: -2.6 }
  ].map((p) => ({ ...p, f: SPHERE.evaluate(p.x, p.y) }));
  var FOCUS = 0;
  var BRIGHTER = DEMO_FLIES.map((f, j) => j).filter((j) => DEMO_FLIES[j].f < DEMO_FLIES[FOCUS].f);
  function demoBeta(i, j) {
    const a = DEMO_FLIES[i];
    const b = DEMO_FLIES[j];
    const r = Math.hypot(a.x - b.x, a.y - b.y) / DEMO_SPAN / Math.SQRT2;
    return attractiveness(1, DEMO_GAMMA, r);
  }
  var DEMO_PATH = (() => {
    const pts = [{ x: DEMO_FLIES[FOCUS].x, y: DEMO_FLIES[FOCUS].y }];
    const cur = { ...pts[0] };
    BRIGHTER.forEach((j) => {
      const target = DEMO_FLIES[j];
      const r = Math.hypot(cur.x - target.x, cur.y - target.y) / DEMO_SPAN / Math.SQRT2;
      const beta = attractiveness(1, DEMO_GAMMA, r);
      cur.x += beta * (target.x - cur.x);
      cur.y += beta * (target.y - cur.y);
      pts.push({ x: cur.x, y: cur.y });
    });
    return pts;
  })();
  var DEMO_RANDOM = { x: 0.35, y: -0.25 };
  function makeHowDraw() {
    let off = null;
    let vp = null;
    return function draw(ctx, { t, bt, beat }) {
      drawBackdrop(ctx, t, "cyan");
      if (!off) {
        off = document.createElement("canvas");
        off.width = PANEL.w;
        off.height = PANEL.h;
        vp = new TopoMap().paint(off.getContext("2d"), PANEL.w, PANEL.h, SPHERE, "fa");
      }
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 28);
      ctx.clip();
      ctx.drawImage(off, PANEL.x, PANEL.y);
      ctx.restore();
      ctx.strokeStyle = "rgba(165,243,252,0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 28);
      ctx.stroke();
      const toS = (p) => {
        const s = vp.worldToScreen(p.x, p.y);
        return { x: PANEL.x + s.x, y: PANEL.y + s.y };
      };
      const maxF = DEMO_FLIES[FOCUS].f;
      const screen = DEMO_FLIES.map(toS);
      if (beat >= 1) {
        BRIGHTER.forEach((j, k) => {
          const b = demoBeta(FOCUS, j);
          const a = seg(bt, 0.15 * k, 0.7, easeOut);
          const strength = beat >= 2 ? b : 0.55;
          drawArrow(ctx, screen[FOCUS], screen[j], {
            color: hexToRgba(COLORS.cyanLight, 0.35 + 0.6 * strength),
            width: beat >= 2 ? 2 + 9 * b : 4,
            progress: beat === 1 ? a : 1,
            bend: 0,
            dashed: beat === 1
          });
          if (beat >= 2) {
            const mx = lerp(screen[FOCUS].x, screen[j].x, 0.55);
            const my = lerp(screen[FOCUS].y, screen[j].y, 0.55);
            drawPill(ctx, `\u03B2 ${b.toFixed(2)}`, mx, my - 26, { size: 22, fill: COLORS.night, color: COLORS.cyanLight, mono: true, alpha: seg(bt, 0.2 + 0.1 * k, 0.5) });
          }
        });
      }
      DEMO_FLIES.forEach((f, i) => {
        const glow = 0.12 + 0.88 * (1 - f.f / (maxF * 1.02));
        const best = f.f === Math.min(...DEMO_FLIES.map((d) => d.f));
        if (i === FOCUS && beat >= 3) return;
        drawFirefly(ctx, screen[i].x, screen[i].y, 24, {
          glow: beat === 0 ? lerp(0.5, glow, seg(bt, 0, 1)) : glow,
          t,
          color: best ? COLORS.gold : COLORS.cyan,
          core: best ? "#fff6d6" : "#f4fdff",
          crown: best
        });
        if (beat === 0) {
          drawPill(ctx, `f = ${f.f.toFixed(1)}`, screen[i].x, screen[i].y + 54, {
            size: 20,
            fill: "rgba(5,13,38,0.82)",
            color: best ? COLORS.gold : COLORS.ink,
            mono: true,
            alpha: seg(bt, 0.3 + 0.1 * i, 0.5)
          });
        }
      });
      if (beat === 0) {
        drawText(ctx, "f kecil = terang", PANEL.x + 34, PANEL.y + 42, { size: 28, color: COLORS.gold });
      }
      if (beat < 3) {
        drawText(ctx, "i", screen[FOCUS].x, screen[FOCUS].y - 52, { size: 32, color: COLORS.cyanLight, align: "center", mono: true });
      }
      if (beat === 3) {
        const pts = DEMO_PATH.map(toS);
        const total = pts.length - 1;
        const prog = seg(bt, 0.2, 2.6, (x) => x) * total;
        let cur = pts[0];
        for (let k = 0; k < total; k++) {
          const local = clamp01(prog - k);
          if (local <= 0) break;
          const a = pts[k];
          const b = pts[k + 1];
          ctx.strokeStyle = hexToRgba(COLORS.cyanLight, 0.8);
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          cur = { x: lerp(a.x, b.x, local), y: lerp(a.y, b.y, local) };
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
        }
        const afterMove = pts[total];
        const randA = seg(bt, 3.1, 0.8, easeOut);
        const walk = vp.worldToScreen(DEMO_PATH[total].x + DEMO_RANDOM.x, DEMO_PATH[total].y + DEMO_RANDOM.y);
        const wp = { x: PANEL.x + walk.x, y: PANEL.y + walk.y };
        if (randA > 0) {
          ctx.save();
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = hexToRgba("#fff", 0.6);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(afterMove.x, afterMove.y, 70 * randA, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          cur = { x: lerp(afterMove.x, wp.x, randA), y: lerp(afterMove.y, wp.y, randA) };
        }
        drawFirefly(ctx, cur.x, cur.y, 24, { glow: 0.45, t });
        drawPill(ctx, "posisi baru = tarikan + langkah acak", PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h - 40, {
          size: 26,
          fill: COLORS.cyan,
          alpha: seg(bt, 3.4, 0.6)
        });
        ctx.save();
        ctx.globalAlpha = 0.4;
        drawFirefly(ctx, screen[FOCUS].x, screen[FOCUS].y, 24, { glow: 0.12, t });
        ctx.restore();
      }
    };
  }
  var faCara = {
    id: "fa-cara",
    chapter: CH.firefly,
    title: "Firefly: cara kerja",
    beats: 4,
    notes: `
    <p>Ini satu kunang-kunang (i) yang paling redup dan enam rekannya di peta sederhana. Semua angka \u03B2 dihitung dengan rumus yang sama dengan simulasi (\u03B3 = 2).</p>
    <ol>
      <li><b>Nilai kecerahan.</b> Hitung f untuk setiap posisi. f kecil berarti terang.</li>
      <li><b>Tertarik.</b> i melihat semua yang lebih terang darinya.</li>
      <li><b>Meredup oleh jarak.</b> Tarikan ke yang dekat kuat, ke yang jauh lemah. Tebal garis = nilai \u03B2.</li>
      <li><b>Bergerak.</b> i bergeser sedikit demi sedikit ke tiap yang lebih terang, lalu ditambah langkah acak kecil supaya tidak terkunci.</li>
    </ol>
    <p>Satu iterasi = tiga tahap itu untuk semua kunang-kunang. Berikutnya kita lihat langsung di simulasi.</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "4 \xB7 Cara kerja Firefly",
        trail: ["Nilai kecerahan", "Tertarik ke yang terang", "Meredup oleh jarak", "Bergerak + acak"],
        beats: [
          { title: "Terang berarti bagus", sub: "Nilai f dihitung dulu untuk setiap kunang-kunang." },
          { title: "Yang redup melihat yang terang", sub: "Tiap kunang-kunang mengincar semua yang lebih terang." },
          { title: "Makin jauh, makin lemah", sub: "Tebal garis menunjukkan daya tarik \u03B2." },
          { title: "Terbang, lalu goyang sedikit", sub: "Tarikan menentukan arah, langkah acak menjaga jelajah." }
        ],
        draw: makeHowDraw()
      });
    }
  };
  var faRenderer = new FARenderer();
  var faSim = {
    id: "fa-sim",
    chapter: CH.firefly,
    title: "Firefly: simulasi langsung",
    notes: `
    <p>Ini mesin Firefly yang sebenarnya, bukan animasi. Tekan Mulai (P), Langkah (S), atau Reset (R).</p>
    <ul>
      <li>Tiap iterasi punya tiga tahap: <b>Ukur kecerahan</b>, <b>Terbang ke yang lebih terang</b>, <b>Langkah acak</b>.</li>
      <li>Garis putus-putus saat terbang adalah tarikan, makin tebal makin kuat. Titik emas dengan mahkota adalah yang paling terang.</li>
      <li>Rastrigin penuh lembah palsu. Coba naikkan \u03B3 untuk melihat kunang-kunang terpecah ke beberapa kelompok, atau turunkan untuk satu kelompok besar.</li>
    </ul>
    <p>Bintang emas di peta menandai optimum global (0, 0) dengan f = 0. Hasil bergantung seed, jadi coba beberapa seed.</p>`,
    mount(container, ctx) {
      return mountConsole(container, ctx, {
        idPrefix: "fa",
        tag: "4 \xB7 Simulasi Firefly",
        title: "Firefly Algorithm",
        color: FA_COLOR,
        renderer: faRenderer,
        speed: 3,
        maxIterations: 30,
        phases: [
          { key: "EVAL", label: "Ukur kecerahan" },
          { key: "MOVE", label: "Terbang" },
          { key: "WALK", label: "Langkah acak" }
        ],
        params: [
          { key: "populationSize", label: "Populasi", min: 6, max: 40, step: 1, value: 20 },
          { key: "beta0", label: "\u03B2\u2080", min: 0.2, max: 1.5, step: 0.05, value: 1 },
          { key: "gamma", label: "\u03B3", min: 0, max: 10, step: 0.1, value: 2 },
          { key: "alpha", label: "\u03B1", min: 0, max: 0.6, step: 0.01, value: 0.25 }
        ],
        createEngine: (config) => {
          const o = config.objective;
          return new FAEngine({
            dim: 2,
            lo: o.min,
            hi: o.max,
            fitness: (x) => o.evaluate(x[0], x[1]),
            populationSize: config.populationSize,
            maxIterations: config.maxIterations,
            seed: config.seed,
            beta0: config.beta0,
            gamma: config.gamma,
            alpha: config.alpha
          });
        }
      });
    }
  };
  var faSlides = [faInspirasi, faKarakter, faCara, faSim];

  // src/slides/baSlides.js
  var PREY = { x: 1500, y: 690 };
  var BOX2 = { x: 120, y: 340, w: 1700, h: 600 };
  function drawPrey(ctx, t, glow = 0.5) {
    const x = PREY.x + Math.sin(t * 1.3) * 12;
    const y = PREY.y + Math.cos(t * 1.7) * 10;
    drawFirefly(ctx, x, y, 22, { glow, t, color: COLORS.pink, core: "#ffe4f1" });
    drawText(ctx, "mangsa", x, y - 66, { size: 28, color: COLORS.pink, align: "center" });
  }
  function drawMeter(ctx, x, y, w, label, value, color) {
    drawText(ctx, label, x, y - 22, { size: 26, color: COLORS.ink });
    ctx.fillStyle = "rgba(242,247,255,0.14)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, 22, 11);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(22, w * clamp01(value)), 22, 11);
    ctx.fill();
  }
  function drawBatInspiration(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, "purple");
    drawGlow(ctx, 1640, 250, 260, "rgba(196,181,253,0.35)");
    ctx.fillStyle = "#e9e3ff";
    ctx.beginPath();
    ctx.arc(1640, 250, 64, 0, Math.PI * 2);
    ctx.fill();
    if (beat === 0) {
      for (let i = 0; i < 7; i++) {
        const p = drift(i + 30, t, BOX2);
        drawEcho(ctx, p.x, p.y, (t * 0.5 + hash01(i) * 3) % 1, COLORS.purpleLight, 120);
        drawBat(ctx, p.x, p.y, 26, { flap: t * 10 + i, angle: Math.sin(t * 0.7 + i) * 0.12 });
      }
      drawPill(ctx, "bersuara, lalu mendengar pantulannya", 960, 1010, { fill: COLORS.purple, color: "#fff", size: 30, alpha: seg(bt, 0.5, 0.7) });
      return;
    }
    drawPrey(ctx, t, 0.55 + 0.4 * Math.abs(Math.sin(t * 3)));
    if (beat === 1) {
      const T = 9;
      const tau = bt % T;
      const k = easeInOut(clamp01(tau / (T - 1.2)));
      const start = { x: 260, y: 790 };
      const end = { x: 1330, y: 710 };
      const bx = lerp(start.x, end.x, k);
      const by = lerp(start.y, end.y, k) + Math.sin(tau * 2) * 8;
      const rate0 = 1.1;
      const rate1 = 7;
      const Tm = T - 1.2;
      const phase = (x) => rate0 * x + (rate1 - rate0) * x * x / (2 * Tm);
      const nNow = Math.floor(phase(Math.min(tau, Tm)));
      for (let n = Math.max(1, nNow - 4); n <= nNow; n++) {
        const a = (rate1 - rate0) / (2 * Tm);
        const emit = (-rate0 + Math.sqrt(rate0 * rate0 + 4 * a * n)) / (2 * a);
        const kk = easeInOut(clamp01(emit / Tm));
        const loud = 1 - 0.75 * kk;
        const ex = lerp(start.x, end.x, kk);
        const ey = lerp(start.y, end.y, kk);
        drawEcho(ctx, ex, ey, clamp01((tau - emit) / 0.9), COLORS.purpleLight, 80 + 190 * loud, loud);
      }
      drawBat(ctx, bx, by, 34, { flap: t * 12, angle: -0.1 });
      const rateNow = rate0 + (rate1 - rate0) * k;
      drawMeter(ctx, 120, 400, 520, "Laju pulsa  r  \u2191 makin sering", clamp01((rateNow - rate0) / (rate1 - rate0)) * 0.9 + 0.1, COLORS.blue);
      drawMeter(ctx, 120, 480, 520, "Kenyaringan  A  \u2193 makin pelan", 1 - 0.75 * k, COLORS.pink);
      return;
    }
    const conv = seg(bt, 0.2, 5.5, easeInOut);
    const bats = Array.from({ length: 8 }, (_, i) => {
      const w = drift(i + 30, t, BOX2);
      const ang = i / 8 * Math.PI * 2 + 0.4;
      const rad = 90 + i % 3 * 55;
      const target = { x: PREY.x - 230 + Math.cos(ang) * rad, y: PREY.y + Math.sin(ang) * rad };
      return { x: lerp(w.x, target.x, conv), y: lerp(w.y, target.y, conv), d: Math.hypot(target.x - PREY.x, target.y - PREY.y) };
    });
    const leader = bats.reduce((m, b, i) => b.d < bats[m].d ? i : m, 0);
    bats.forEach((b, i) => {
      if (i !== leader) {
        ctx.strokeStyle = hexToRgba(COLORS.gold, 0.2 * conv);
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(bats[leader].x, bats[leader].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    bats.forEach((b, i) => {
      drawEcho(ctx, b.x, b.y, (t * 0.7 + i * 0.3) % 1, COLORS.purpleLight, 80, 0.6);
      drawBat(ctx, b.x, b.y, 26, {
        flap: t * 11 + i,
        color: i === leader ? "#fcd34d" : COLORS.purple,
        edge: i === leader ? "#fff6d6" : COLORS.purpleLight,
        crown: i === leader,
        glow: i === leader ? 1 : 0
      });
    });
    drawPill(ctx, "semua mengarah ke kelelawar terbaik, x*", 960, 1010, { fill: COLORS.gold, size: 30, alpha: seg(bt, 1.8, 0.7) });
  }
  var baInspirasi = {
    id: "ba-inspirasi",
    chapter: CH.bat,
    title: "Bat: inspirasi",
    beats: 3,
    notes: `
    <p><b>Beat 1.</b> Kelelawar mikro memakai ekolokasi: mengeluarkan pulsa suara, lalu mendengar pantulannya untuk menebak jarak dan lokasi mangsa.</p>
    <p><b>Beat 2.</b> Semakin dekat ke mangsa, kelelawar memancarkan pulsa lebih sering (laju pulsa r naik) dan lebih pelan (kenyaringan A turun). Dua angka inilah yang nanti jadi parameter algoritma.</p>
    <p><b>Beat 3.</b> Dalam algoritma, kelelawar terbaik saat ini (x*) jadi arah tujuan. Yang lain terbang ke sana dengan frekuensi acak, lalu menjelajah dekat x*.</p>
    <p>Catatan akademik: analogi "r naik dan A turun" berasal dari Yang (2010). Pada pseudo-code aslinya, jelajah lokal dipilih saat rand lebih besar dari r. Artinya ketika r naik, jelajah lokal justru makin jarang. Sebagian literatur menyoroti ketidakselarasan analogi ini, jadi baca sumber aslinya bila dosen bertanya.</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "5 \xB7 Bat Algorithm",
        beats: [
          { title: "Kelelawar bersuara lalu mendengar gema", sub: "Gema memberi tahu seberapa jauh mangsa." },
          { title: "Makin dekat, makin sering tapi makin pelan", sub: "Laju pulsa naik, kenyaringan turun." },
          { title: "Satu kelelawar terbaik jadi arah tujuan", sub: "Yang lain mengikuti, lalu menjelajah di sekitarnya." }
        ],
        draw: drawBatInspiration
      });
    }
  };
  function drawBaCharacter(ctx, { t }, p, pointer) {
    ctx.clearRect(0, 0, LAB_W, LAB_H);
    drawBackdrop(ctx, t, "purple", LAB_W, LAB_H);
    const px = 110;
    const py = 120;
    const pw = 820;
    const ph = 330;
    const maxT = 30;
    const maxY = Math.max(1.2, p.loudness * 1.1);
    const yOf = (v) => py + ph - v / maxY * ph;
    const xOf = (k2) => px + k2 / maxT * pw;
    drawText(ctx, "A turun dan r naik seiring iterasi", px, 38, { size: 32, color: COLORS.ink });
    drawText(ctx, "Gerakkan kursor di grafik untuk memilih iterasi", px, 78, { size: 22, color: COLORS.muted, weight: 600 });
    ctx.strokeStyle = "rgba(169,187,214,0.25)";
    ctx.lineWidth = 2;
    [0, 0.5, 1, 1.5, 2].filter((v) => v <= maxY + 0.01).forEach((v) => {
      ctx.beginPath();
      ctx.moveTo(px, yOf(v));
      ctx.lineTo(px + pw, yOf(v));
      ctx.stroke();
      drawText(ctx, v.toFixed(1), px - 14, yOf(v), { size: 21, color: COLORS.muted, align: "right", mono: true, weight: 600 });
    });
    [0, 10, 20, 30].forEach((k2) => drawText(ctx, String(k2), xOf(k2), py + ph + 28, { size: 21, color: COLORS.muted, align: "center", mono: true, weight: 600 }));
    drawText(ctx, "iterasi (jumlah penerimaan) t", px + pw / 2, py + ph + 66, { size: 23, color: COLORS.muted, align: "center", weight: 600 });
    const curveA = new Path2D();
    const curveR = new Path2D();
    for (let k2 = 0; k2 <= maxT; k2 += 0.5) {
      const a = loudnessAt(p.loudness, p.alphaA, k2);
      const r2 = pulseRateAt(p.pulseRate, p.gammaR, k2);
      if (k2 === 0) {
        curveA.moveTo(xOf(k2), yOf(a));
        curveR.moveTo(xOf(k2), yOf(r2));
      } else {
        curveA.lineTo(xOf(k2), yOf(a));
        curveR.lineTo(xOf(k2), yOf(r2));
      }
    }
    ctx.save();
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.shadowBlur = 14;
    ctx.shadowColor = COLORS.pink;
    ctx.strokeStyle = COLORS.pink;
    ctx.stroke(curveA);
    ctx.shadowColor = COLORS.blue;
    ctx.strokeStyle = COLORS.blueLight;
    ctx.stroke(curveR);
    ctx.restore();
    drawPill(ctx, "A kenyaringan", px + pw - 330, py + 62, { size: 21, fill: COLORS.pink, color: COLORS.night });
    drawPill(ctx, "r laju pulsa", px + pw - 110, py + 62, { size: 21, fill: COLORS.blueLight, color: COLORS.night });
    const overChart = pointer.active && pointer.x > px && pointer.x < px + pw && pointer.y > py - 40 && pointer.y < py + ph + 80;
    const k = overChart ? clamp01((pointer.x - px) / pw) * maxT : (0.5 - 0.5 * Math.cos(t * 0.45)) * maxT;
    const A = loudnessAt(p.loudness, p.alphaA, k);
    const r = pulseRateAt(p.pulseRate, p.gammaR, k);
    ctx.strokeStyle = hexToRgba(COLORS.gold, 0.8);
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(xOf(k), py);
    ctx.lineTo(xOf(k), py + ph);
    ctx.stroke();
    ctx.setLineDash([]);
    [[A, COLORS.pink], [r, COLORS.blueLight]].forEach(([v, c]) => {
      drawGlow(ctx, xOf(k), yOf(v), 30, hexToRgba(c, 0.6));
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(xOf(k), yOf(v), 10, 0, Math.PI * 2);
      ctx.fill();
    });
    drawPill(ctx, `t = ${k.toFixed(0)}   A = ${A.toFixed(2)}   r = ${r.toFixed(2)}`, Math.min(px + pw - 200, Math.max(px + 200, xOf(k))), py - 6, {
      size: 21,
      fill: COLORS.gold,
      mono: true
    });
    const dx = 1010;
    const bx = dx + 180;
    const by = 255;
    drawText(ctx, "Kelelawar pada iterasi ini", dx, 38, { size: 30, color: COLORS.ink });
    const pulses = 0.6 + r * 4.4;
    for (let n = 0; n < 3; n++) {
      drawEcho(ctx, bx, by, (t * pulses + n / 3) % 1, COLORS.purpleLight, 50 + 120 * (A / Math.max(0.5, p.loudness)), 0.9);
    }
    drawBat(ctx, bx, by, 44, { flap: t * 12 });
    drawText(ctx, `lingkaran gema \u2248 kenyaringan  (A = ${A.toFixed(2)})`, dx, 452, { size: 25, color: COLORS.pink });
    drawText(ctx, `gema lebih sering \u2248 laju pulsa  (r = ${r.toFixed(2)})`, dx, 494, { size: 25, color: COLORS.blueLight });
    drawText(ctx, `Peluang jelajah lokal (rand > r): ${(clamp01(1 - r) * 100).toFixed(0)}%`, dx, 546, { size: 25, color: COLORS.gold });
    drawText(ctx, `Radius jelajah lokal \u221D A: ${(A * 10).toFixed(1)}% lebar ruang`, dx, 588, { size: 25, color: COLORS.gold });
  }
  var baKarakter = {
    id: "ba-karakter",
    chapter: CH.bat,
    title: "Bat: parameter pengatur",
    notes: `
    <p>Boleh dimainkan. Geser slider dan perhatikan dua kurva.</p>
    <ul>
      <li><b>A (kenyaringan)</b> mulai dari A\u2080 dan dikalikan \u03B1_A setiap kali sebuah solusi diterima. A mengatur peluang menerima percobaan (rand &lt; A) dan juga radius jelajah lokal.</li>
      <li><b>r (laju pulsa)</b> mulai dari 0 lalu naik menuju r\u2080 lewat r\u2080(1 \u2212 e^(\u2212\u03B3t)). Aturannya: bila rand lebih besar dari r, kelelawar menjelajah lokal di dekat x*.</li>
    </ul>
    <p>Tampak jelas bahwa A menurun cepat bila \u03B1_A kecil. Setelah A kecil, hampir tidak ada percobaan yang diterima dan jelajah lokal menyempit: algoritma "mengunci" ke solusi terbaik. Ini mengontrol konvergensi, tetapi juga bisa terlalu dini bila \u03B1_A terlalu kecil.</p>
    <p>Untuk jujur secara akademik: karena jelajah lokal dipilih saat rand &gt; r, kenaikan r mengurangi jelajah lokal. Itu pembacaan literal pseudo-code Yang (2010) dan disoroti beberapa ulasan sebagai bagian yang kurang intuitif.</p>`,
    mount(container, ctx) {
      return mountLab(container, ctx, {
        tag: "5 \xB7 Bat Algorithm",
        title: "Parameter pengatur",
        color: BA_COLOR,
        intro: "Dua nilai berubah seiring waktu. Geser untuk melihat bentuk kurva dan gemanya.",
        sliders: [
          { key: "loudness", label: "A\u2080 kenyaringan awal", min: 0.2, max: 2, step: 0.05, value: 1, desc: "Radius jelajah lokal dan peluang menerima mulai dari sini." },
          { key: "pulseRate", label: "r\u2080 laju pulsa maksimum", min: 0.1, max: 1, step: 0.05, value: 0.5, desc: "Batas atas r setelah banyak iterasi." },
          { key: "alphaA", label: "\u03B1_A peluruh kenyaringan", min: 0.5, max: 0.99, step: 0.01, value: 0.9, desc: "Makin kecil, makin cepat A turun." },
          { key: "gammaR", label: "\u03B3_r pertumbuhan laju", min: 0.05, max: 2, step: 0.05, value: 0.9, desc: "Makin besar, makin cepat r naik." }
        ],
        draw: drawBaCharacter
      });
    }
  };
  var PANEL2 = { x: 640, y: 330, w: 1240, h: 660 };
  var SPHERE2 = landscapeById("sphere");
  var A_DEMO = 0.9;
  var R_DEMO = 0.3;
  var BEST = { x: 0.8, y: 0.5 };
  var BATS = [
    { x: -3.5, y: 2.5, name: "i" },
    { x: 3, y: -3.2, name: "" },
    { x: -2.2, y: -2.5, name: "k" },
    { x: 1.6, y: 1, name: "m" }
  ].map((b) => ({ ...b, f: SPHERE2.evaluate(b.x, b.y) }));
  var TRIALS = [
    { freq: 0.7, rand: 0.18, accept: 0.41 },
    { freq: 0.5, rand: 0.12, accept: 0.33 },
    { freq: 0.4, rand: 0.62, accept: 0.95 },
    { freq: 0.9, rand: 0.2, accept: 0.5, override: { x: -1.9, y: 1.8 } }
  ];
  BATS.forEach((b, i) => {
    const tr = TRIALS[i];
    tr.global = tr.override || { x: b.x + (BEST.x - b.x) * tr.freq, y: b.y + (BEST.y - b.y) * tr.freq };
    tr.local = i === 2 ? { x: BEST.x - 0.35, y: BEST.y + 0.55 } : null;
    tr.final = tr.rand > R_DEMO && tr.local ? tr.local : tr.global;
    tr.fFinal = SPHERE2.evaluate(tr.final.x, tr.final.y);
    tr.better = tr.fFinal < b.f;
    tr.accepted = tr.accept < A_DEMO && tr.better;
  });
  var LOCAL_RADIUS = A_DEMO * 0.1 * (SPHERE2.max - SPHERE2.min);
  var PILL_DY = [58, -64, 108, -112];
  var clampPillX = (x) => Math.min(PANEL2.x + PANEL2.w - 190, Math.max(PANEL2.x + 190, x));
  function makeBatHowDraw() {
    let off = null;
    let vp = null;
    return function draw(ctx, { t, bt, beat }) {
      drawBackdrop(ctx, t, "purple");
      if (!off) {
        off = document.createElement("canvas");
        off.width = PANEL2.w;
        off.height = PANEL2.h;
        vp = new TopoMap().paint(off.getContext("2d"), PANEL2.w, PANEL2.h, SPHERE2, "ba");
      }
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(PANEL2.x, PANEL2.y, PANEL2.w, PANEL2.h, 28);
      ctx.clip();
      ctx.drawImage(off, PANEL2.x, PANEL2.y);
      ctx.restore();
      ctx.strokeStyle = "rgba(196,181,253,0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(PANEL2.x, PANEL2.y, PANEL2.w, PANEL2.h, 28);
      ctx.stroke();
      const S = (p) => {
        const s = vp.worldToScreen(p.x, p.y);
        return { x: PANEL2.x + s.x, y: PANEL2.y + s.y };
      };
      const best = S(BEST);
      const bats = BATS.map(S);
      const showLocal = beat >= 1;
      if (showLocal) {
        ctx.save();
        ctx.setLineDash([10, 8]);
        ctx.strokeStyle = hexToRgba(COLORS.pink, 0.9);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(best.x, best.y, vp.worldDistToPx(LOCAL_RADIUS) * seg(bt, 0, 0.7, easeOut), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      BATS.forEach((b, i) => {
        const tr = TRIALS[i];
        const from = bats[i];
        const g = S(tr.global);
        const l = tr.local ? S(tr.local) : null;
        const usesLocal = beat >= 1 && tr.rand > R_DEMO && l;
        const target = usesLocal ? l : g;
        const staggered = seg(bt, 0.12 * i, 0.8, easeOut);
        if (beat === 0) {
          drawEcho(ctx, from.x, from.y, (t * 0.5 + i * 0.25) % 1, COLORS.purpleLight, 80, 0.8);
          drawArrow(ctx, from, g, { color: COLORS.purpleLight, width: 5, progress: staggered, dashed: true });
          if (staggered > 0.6) {
            drawPill(ctx, `f = ${tr.freq.toFixed(1)}`, lerp(from.x, g.x, 0.5), lerp(from.y, g.y, 0.5) - 28, { size: 20, fill: COLORS.night, color: COLORS.purpleLight, mono: true });
          }
        } else if (beat === 1) {
          if (usesLocal) {
            drawCross(ctx, g.x, g.y, 9, COLORS.coral, 0.65);
            drawArrow(ctx, from, l, { color: COLORS.pink, width: 5, progress: seg(bt, 0.7 + 0.1 * i, 0.9, easeOut), dashed: true });
          } else {
            drawArrow(ctx, from, g, { color: COLORS.purpleLight, width: 5, dashed: true });
          }
          const lab = usesLocal ? `rand ${tr.rand.toFixed(2)} > r ${R_DEMO} : lokal` : `rand ${tr.rand.toFixed(2)} \u2264 r : tetap`;
          drawPill(ctx, lab, clampPillX(from.x), from.y + PILL_DY[i % 4], { size: 19, fill: "rgba(5,13,38,0.85)", color: usesLocal ? COLORS.pink : COLORS.purpleLight, mono: true, alpha: seg(bt, 1.2, 0.5) });
        } else {
          const dest = S(tr.final);
          const move = tr.accepted ? seg(bt, 0.5 + 0.15 * i, 1, easeInOut) : 0;
          drawArrow(ctx, from, dest, { color: hexToRgba(COLORS.purpleLight, 0.5), width: 4, dashed: true, alpha: tr.accepted ? 1 - move : 1 });
          if (tr.accepted) drawCheck(ctx, dest.x, dest.y - 28, 11, COLORS.lime, seg(bt, 1.2 + 0.15 * i, 0.4));
          else drawCross(ctx, dest.x, dest.y, 11, COLORS.coral, seg(bt, 0.9 + 0.15 * i, 0.4));
          const why = tr.accepted ? `rand ${tr.accept.toFixed(2)} < A, lebih baik` : !tr.better ? "lebih buruk: ditolak" : `lebih baik, tapi rand ${tr.accept.toFixed(2)} > A`;
          const tint = tr.accepted ? COLORS.lime : COLORS.coral;
          const badgeA = seg(bt, 1.5 + 0.15 * i, 0.5);
          const bxp = dest.x + 26;
          const byp = dest.y - 30;
          ctx.save();
          ctx.globalAlpha *= badgeA;
          ctx.fillStyle = tint;
          ctx.beginPath();
          ctx.arc(bxp, byp, 16, 0, Math.PI * 2);
          ctx.fill();
          drawText(ctx, String(i + 1), bxp, byp, { size: 20, color: COLORS.night, align: "center", weight: 800 });
          ctx.restore();
          const ly = PANEL2.y + 56 + i * 58;
          const lx = PANEL2.x + PANEL2.w - 40;
          ctx.save();
          ctx.globalAlpha *= badgeA;
          ctx.font = "700 22px Manrope, sans-serif";
          const lw = ctx.measureText(why).width + 84;
          ctx.fillStyle = "rgba(5,13,38,0.9)";
          ctx.beginPath();
          ctx.roundRect(lx - lw, ly - 24, lw, 48, 24);
          ctx.fill();
          ctx.fillStyle = tint;
          ctx.beginPath();
          ctx.arc(lx - lw + 28, ly, 15, 0, Math.PI * 2);
          ctx.fill();
          drawText(ctx, String(i + 1), lx - lw + 28, ly, { size: 19, color: COLORS.night, align: "center", weight: 800 });
          drawText(ctx, why, lx - lw + 54, ly, { size: 22, color: tint, weight: 700 });
          ctx.restore();
        }
      });
      BATS.forEach((b, i) => {
        const tr = TRIALS[i];
        let pos = bats[i];
        if (beat === 2 && tr.accepted) {
          const d = S(tr.final);
          const m = seg(bt, 0.5 + 0.15 * i, 1, easeInOut);
          pos = { x: lerp(pos.x, d.x, m), y: lerp(pos.y, d.y, m) };
        }
        drawBat(ctx, pos.x, pos.y, 22, { flap: t * 10 + i });
      });
      drawBat(ctx, best.x, best.y, 26, { flap: t * 10, color: "#fcd34d", edge: "#fff6d6", crown: true, glow: 1 });
      drawText(ctx, "x*", best.x + 42, best.y + 34, { size: 28, color: COLORS.gold, mono: true });
      if (beat === 2) {
        const a = seg(bt, 2.4, 0.6);
        const bx = PANEL2.x + 44;
        const by = PANEL2.y + PANEL2.h - 140;
        ctx.save();
        ctx.globalAlpha *= 0.6 + 0.4 * a;
        ctx.fillStyle = "rgba(5,13,38,0.95)";
        ctx.strokeStyle = "rgba(196,181,253,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx - 20, by - 50, 470, 170, 20);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        drawText(ctx, "Bat i setelah menerima:", bx, by - 20, { size: 26, color: COLORS.ink, alpha: a });
        drawText(ctx, `A  1.00 \u2192 ${A_DEMO.toFixed(2)}  (turun)`, bx, by + 25, { size: 26, color: COLORS.pink, mono: true, alpha: a });
        drawText(ctx, `r  0.00 \u2192 ${pulseRateAt(0.5, 0.9, 1).toFixed(2)}  (naik)`, bx, by + 70, { size: 26, color: COLORS.blueLight, mono: true, alpha: a });
      }
    };
  }
  var baCara = {
    id: "ba-cara",
    chapter: CH.bat,
    title: "Bat: cara kerja",
    beats: 3,
    notes: `
    <p>Peta kecil yang sama dengan Firefly, kali ini dengan empat kelelawar dan x* sebagai yang terbaik. Nilai rand dan hasil terima/tolak adalah contoh tetap agar mudah dijelaskan.</p>
    <ol>
      <li><b>Pulsa menuju x*.</b> Setiap kelelawar menarik frekuensi acak f. Kecepatannya bertambah (x* \u2212 x)\xB7f, lalu posisi percobaan = posisi + kecepatan. Perhatikan kelelawar m: kecepatan lamanya membuatnya melampaui x*.</li>
      <li><b>Jelajah lokal.</b> Jika rand lebih besar dari r, percobaan global diganti titik acak di sekitar x*. Radius = A \xB7 10% lebar ruang.</li>
      <li><b>Terima atau tolak.</b> Terima hanya bila rand &lt; A <i>dan</i> percobaan lebih baik. Ada kasus lebih baik tetapi tetap ditolak karena rand melebihi A. Bila diterima, A dikalikan \u03B1_A dan r naik.</li>
    </ol>
    <p>Dalam simulasi, urutan tiga tahap ini sama persis: Pulsa, Jelajah lokal, Terima.</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "6 \xB7 Cara kerja Bat",
        trail: ["Pulsa menuju x*", "Jelajah lokal", "Terima atau tolak"],
        beats: [
          { title: "Terbang menuju yang terbaik", sub: "Frekuensi acak f menentukan seberapa jauh melangkah." },
          { title: "Kadang menjelajah di dekat x*", sub: "Bila rand > r, titik percobaan diganti titik acak sekitar x*." },
          { title: "Hanya yang lolos yang berpindah", sub: "Harus lebih baik dan lolos peluang kenyaringan A." }
        ],
        draw: makeBatHowDraw()
      });
    }
  };
  var baRenderer = new BARenderer();
  var baSim = {
    id: "ba-sim",
    chapter: CH.bat,
    title: "Bat: simulasi langsung",
    notes: `
    <p>Mesin Bat sungguhan. Tombol sama: Mulai (P), Langkah (S), Reset (R).</p>
    <ul>
      <li>Tiga tahap per iterasi: <b>Pulsa</b> (belah ketupat ungu = posisi percobaan), <b>Jelajah lokal</b> (cincin merah muda di sekitar x*), <b>Terima</b> (centang hijau berpindah, silang merah ditolak).</li>
      <li>Di iterasi awal r masih 0, jadi hampir semua kelelawar menjelajah lokal. Seiring r naik, sebagian tetap memakai percobaan global.</li>
      <li>Teks di panel kanan menampilkan \u0100 dan r\u0304 yang berubah setiap iterasi.</li>
    </ul>
    <p>Anggaran evaluasi Bat sama dengan Firefly: satu evaluasi per individu per iterasi. Itu yang membuat perbandingan di slide berikutnya adil.</p>`,
    mount(container, ctx) {
      return mountConsole(container, ctx, {
        idPrefix: "ba",
        tag: "6 \xB7 Simulasi Bat",
        title: "Bat Algorithm",
        color: BA_COLOR,
        renderer: baRenderer,
        speed: 3,
        maxIterations: 30,
        phases: [
          { key: "PULSE", label: "Pulsa" },
          { key: "LOCAL", label: "Jelajah lokal" },
          { key: "ACCEPT", label: "Terima" }
        ],
        params: [
          { key: "populationSize", label: "Populasi", min: 6, max: 40, step: 1, value: 20 },
          { key: "fmax", label: "f maks", min: 0.5, max: 2.5, step: 0.1, value: 1.5 },
          { key: "loudness", label: "A\u2080", min: 0.2, max: 2, step: 0.05, value: 1 },
          { key: "pulseRate", label: "r\u2080", min: 0.1, max: 1, step: 0.05, value: 0.5 },
          { key: "alphaA", label: "\u03B1_A", min: 0.5, max: 0.99, step: 0.01, value: 0.9 },
          { key: "gammaR", label: "\u03B3_r", min: 0.05, max: 2, step: 0.05, value: 0.9 }
        ],
        createEngine: (config) => {
          const o = config.objective;
          return new BAEngine({
            dim: 2,
            lo: o.min,
            hi: o.max,
            fitness: (x) => o.evaluate(x[0], x[1]),
            populationSize: config.populationSize,
            maxIterations: config.maxIterations,
            seed: config.seed,
            fmax: config.fmax,
            loudness: config.loudness,
            pulseRate: config.pulseRate,
            alphaA: config.alphaA,
            gammaR: config.gammaR
          });
        }
      });
    }
  };
  var baSlides = [baInspirasi, baKarakter, baCara, baSim];

  // src/slides/modelSlides.js
  var TASKS2 = generateTasks(16, 2026);
  var VMS2 = DEFAULT_VMS;
  var VECTOR = sharedInitialPopulation(16, 4, 1, 11)[0];
  var ASSIGN = decodeSchedule(VECTOR, 4);
  var EVAL = evaluateSchedule(VECTOR, TASKS2, VMS2);
  var LAYOUT = layoutOf(EVAL);
  var LANE_COLORS = [COLORS.blue, COLORS.cyan, COLORS.purple, COLORS.pink];
  var STEP_LABELS = ["1 \xB7 Posisi = angka", "2 \xB7 Bulatkan jadi VM", "3 \xB7 Jumlahkan waktu", "4 \xB7 Makespan = fitness"];
  var STEP_X = [230, 640, 1060, 1500];
  function drawFitnessScene(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, "gold");
    STEP_LABELS.forEach((label, i) => {
      const active = i === beat;
      drawPill(ctx, label, STEP_X[i], 292, {
        size: 24,
        fill: active ? COLORS.gold : "rgba(255,255,255,0.07)",
        color: active ? COLORS.night : COLORS.muted,
        alpha: active ? 1 : 0.8
      });
    });
    const showChips = beat <= 1;
    const chipW = 202;
    const chipH = 92;
    if (showChips) {
      TASKS2.forEach((task, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const x = 70 + col * (chipW + 12);
        const y = 350 + row * (chipH + 22);
        const appear = seg(bt, 0.05 * i, 0.5, easeOut);
        const flip = beat === 1 ? seg(bt, 0.1 + 0.07 * i, 0.5) : 0;
        ctx.save();
        ctx.globalAlpha *= appear;
        ctx.fillStyle = hexToRgba(taskColor(task.id), 0.16);
        ctx.strokeStyle = taskColor(task.id);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, y - (1 - appear) * 30, chipW, chipH, 16);
        ctx.fill();
        ctx.stroke();
        drawText(ctx, task.name, x + 16, y + 22 - (1 - appear) * 30, { size: 22, color: taskColor(task.id), mono: true });
        if (flip < 0.5) {
          drawText(ctx, VECTOR[i].toFixed(2), x + chipW / 2, y + 58 - (1 - appear) * 30, { size: 38, align: "center", mono: true, alpha: 1 - flip * 2 });
        } else {
          const a = (flip - 0.5) * 2;
          drawText(ctx, `\u230A${VECTOR[i].toFixed(2)}\u230B`, x + chipW / 2, y + 35 - (1 - appear) * 30, { size: 22, align: "center", mono: true, color: COLORS.muted, alpha: a });
          ctx.fillStyle = LANE_COLORS[ASSIGN[i]];
          ctx.beginPath();
          ctx.roundRect(x + 36, y + 50 - (1 - appear) * 30, chipW - 72, 34, 12);
          ctx.fill();
          drawText(ctx, `VM-${ASSIGN[i] + 1}`, x + chipW / 2, y + 67 - (1 - appear) * 30, { size: 24, align: "center", color: COLORS.night, weight: 800, alpha: a });
        }
        ctx.restore();
      });
      if (beat === 0) {
        drawMath(ctx, "X = (x_1, x_2, \u2026, x_{16}),   x_i \u2208 [0, 4)", 120, 640, { size: 46, color: COLORS.gold });
        drawText(ctx, "Satu posisi kunang-kunang atau kelelawar = satu daftar angka. Setiap angka mewakili satu tugas.", 120, 730, { size: 32, color: COLORS.muted });
        drawText(ctx, "Angka ini hanyalah koordinat. Belum ada VM.", 120, 785, { size: 32, color: COLORS.ink });
      } else {
        drawMath(ctx, "VM_i = \u230Ax_i\u230B + 1", 120, 640, { size: 46, color: COLORS.gold });
        drawText(ctx, "Pembulatan ke bawah mengubah koordinat menjadi nomor VM.", 120, 730, { size: 32, color: COLORS.muted });
        drawText(ctx, "Geser sedikit saja angkanya dan satu tugas bisa pindah VM.", 120, 785, { size: 32, color: COLORS.ink });
      }
      return;
    }
    const rect = { x: 100, y: 400, w: 1720, h: 420 };
    const tMax = Math.max(EVAL.makespan * 1.1, 1);
    drawSchedule(ctx, rect, TASKS2, VMS2, LAYOUT, {
      tMax,
      laneColor: COLORS.blue,
      queue: { x: 140, y: 340 },
      appear: beat === 2 ? (idx) => clamp01((bt - 0.15 * idx) / 0.8) : () => 1,
      makespan: beat === 3 ? EVAL.makespan : null
    });
    const trackX = rect.x + 168;
    const trackW = rect.w - 168;
    const laneH = (rect.h - 14 * 3) / 4;
    EVAL.vmLoads.forEach((load, j) => {
      const y = rect.y + j * (laneH + 14) + laneH / 2;
      const isMax = Math.abs(load - EVAL.makespan) < 1e-9;
      const x = trackX + load / tMax * trackW + 14;
      drawText(ctx, `L${j + 1} = ${load.toFixed(2)} s`, Math.min(x, 1650), y, {
        size: 26,
        mono: true,
        color: beat === 3 && isMax ? COLORS.gold : COLORS.ink,
        alpha: beat === 2 ? seg(bt, 2.8, 0.6) : 1,
        weight: isMax && beat === 3 ? 800 : 600
      });
    });
    if (beat === 2) {
      const ex = TASKS2[2];
      const vm = VMS2[ASSIGN[2]];
      drawMath(ctx, `t = MI / MIPS = ${ex.mi} / ${vm.mips} = ${(ex.mi / vm.mips).toFixed(2)} s   (contoh ${ex.name} di VM-${ASSIGN[2] + 1})`, 100, 880, { size: 34, color: COLORS.gold, alpha: seg(bt, 0.6, 0.6) });
      drawMath(ctx, "L_j = \u03A3 t_{ij}   untuk semua tugas i di VM j", 100, 940, { size: 34, color: COLORS.ink, alpha: seg(bt, 2.4, 0.6) });
    } else {
      drawMath(ctx, "F(X) = max_j L_j + 0.001 \xB7 \u03C3(L)", 100, 890, { size: 44, color: COLORS.gold });
      drawText(ctx, `makespan = ${EVAL.makespan.toFixed(2)} s di VM-${EVAL.vmLoads.indexOf(EVAL.makespan) + 1}.   Suku \u03C3 hanya pemecah seri (${TIE_BREAK}), tidak mengubah urutan makespan.`, 100, 950, {
        size: 27,
        color: COLORS.muted
      });
    }
  }
  var modelFitness = {
    id: "model-fitness",
    chapter: CH.model,
    title: "Model: posisi menjadi jadwal",
    beats: 4,
    notes: `
    <p>Sekarang rumusnya, setelah gerakannya terlihat. Masalah penjadwalan kita diskrit (tugas ke VM), tetapi FA dan BA bekerja di ruang kontinu. Jembatannya sederhana.</p>
    <ol>
      <li><b>Posisi.</b> Satu agen = vektor X dengan satu angka per tugas, masing-masing di rentang [0, m) dengan m = jumlah VM.</li>
      <li><b>Dekode.</b> Nomor VM tugas i = lantai dari x_i (ditambah satu untuk penomoran). Ini yang disebut decoding.</li>
      <li><b>Waktu.</b> Waktu eksekusi t = MI / MIPS. Beban VM j (L_j) adalah jumlah waktu semua tugas di VM itu.</li>
      <li><b>Fitness.</b> Makespan = max L_j. Suku 0,001\xB7\u03C3 hanya pemecah seri agar jadwal dengan makespan sama tetap bisa dibedakan.</li>
    </ol>
    <p>Fungsi yang sama dipanggil oleh FA dan BA. Itulah yang membuat perbandingannya adil. Catatan: Yousif dkk. (2011) memakai aturan SPV (smallest position value) untuk memetakan posisi ke sumber daya. Di sini dipakai pembulatan sederhana, alasannya kemudahan visualisasi.</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "7 \xB7 Model matematis dan fungsi fitness",
        beats: [
          { title: "Satu posisi adalah satu daftar angka", sub: "Satu angka untuk setiap tugas." },
          { title: "Dibulatkan menjadi nomor VM", sub: "Koordinat kontinu menjadi jadwal diskrit." },
          { title: "Tiap VM menjumlahkan waktu kerjanya", sub: "Waktu = panjang tugas dibagi kecepatan VM." },
          { title: "Yang paling terlambat menentukan nilai", sub: "Makespan kecil berarti jadwal bagus." }
        ],
        draw: drawFitnessScene
      });
    }
  };
  var FA_EQ = [
    { tag: "jarak", eq: "r_{ij} = \u221A( mean_d ((x_{id} \u2212 x_{jd}) / L)^2 )", note: "dinormalkan oleh lebar domain L, hasil 0 sampai 1" },
    { tag: "tarikan", eq: "\u03B2(r) = \u03B2_0 \xB7 e^{\u2212\u03B3 r^2}", note: "makin jauh, makin lemah" },
    { tag: "terbang", eq: "x_i \u2190 x_i + \u03B2(r_{ij}) \xB7 (x_j \u2212 x_i)", note: "untuk setiap j dengan f(x_j) < f(x_i)" },
    { tag: "goyang", eq: "x_i \u2190 x_i + \u03B1_t \xB7 (rand \u2212 0.5) \xB7 L", note: "\u03B1_{t+1} = \u03B4 \xB7 \u03B1_t, langkah acak menyusut" }
  ];
  var BA_EQ = [
    { tag: "frekuensi", eq: "f_i = f_{min} + (f_{max} \u2212 f_{min}) \xB7 u", note: "u acak di [0, 1]" },
    { tag: "pulsa", eq: "v_i \u2190 v_i + (x* \u2212 x_i) \xB7 f_i,   x_{try} = x_i + v_i", note: "terbang menuju x* (tanda mengikuti penjelasan, lihat catatan)" },
    { tag: "lokal", eq: "jika rand > r_i:  x_{try} = x* + \u03B5 \xB7 \u0100 \xB7 0.1 L", note: "\u03B5 \u2208 [\u22121, 1], \u0100 = kenyaringan rata-rata" },
    { tag: "terima", eq: "terima bila rand < A_i dan f(x_{try}) < f(x_i)", note: "lalu A_i \u2190 \u03B1_A A_i,   r_i = r_0 (1 \u2212 e^{\u2212\u03B3t})" }
  ];
  function drawEquations(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, "blue");
    const cols = [
      { x: 64, w: 880, color: FA_COLOR, light: COLORS.cyanLight, title: "Firefly", rows: FA_EQ },
      { x: 976, w: 880, color: BA_COLOR, light: COLORS.purpleLight, title: "Bat", rows: BA_EQ }
    ];
    cols.forEach((col) => {
      ctx.fillStyle = hexToRgba(col.color, 0.1);
      ctx.strokeStyle = hexToRgba(col.color, 0.55);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(col.x, 330, col.w, 660, 26);
      ctx.fill();
      ctx.stroke();
      drawText(ctx, col.title, col.x + 34, 380, { size: 42, color: col.light, weight: 800 });
      col.rows.forEach((row, k) => {
        const y = 450 + k * 138;
        const a = k <= beat ? seg(k === beat ? bt : 9, 0, 0.6, easeOut) : 0;
        if (a <= 0) return;
        ctx.save();
        ctx.translate(0, (1 - a) * 24);
        drawPill(ctx, row.tag, col.x + 34 + 60, y, { size: 21, fill: col.color, color: COLORS.night, alpha: a });
        drawMath(ctx, row.eq, col.x + 34, y + 44, { size: col.title === "Bat" ? 26 : 29, color: COLORS.ink, alpha: a });
        drawMath(ctx, row.note, col.x + 34, y + 84, { size: 21, color: COLORS.muted, weight: 500, alpha: a });
        ctx.restore();
      });
    });
  }
  var modelPersamaan = {
    id: "model-persamaan",
    chapter: CH.model,
    title: "Model: persamaan FA dan BA",
    beats: 4,
    notes: `
    <p>Setiap baris persamaan sudah pernah muncul sebagai gerakan. Tekan panah kanan untuk membuka pasangan berikutnya.</p>
    <p><b>Firefly:</b> jarak yang dinormalkan, daya tarik yang meredup, terbang ke yang lebih terang, lalu goyang acak. Sumber: Yang (2009) dan penerapannya pada penjadwalan job di grid oleh Yousif dkk. (2011).</p>
    <p><b>Bat:</b> frekuensi acak, kecepatan menuju x*, jelajah lokal, lalu terima atau tolak dengan kenyaringan. Sumber: Yang (2010). Penerapan penjadwalan workflow di cloud oleh Raghavan dkk. (2015).</p>
    <p>Catatan jujur: (1) Jarak dan langkah acak pada Firefly dinormalkan oleh lebar domain agar \u03B3 dan \u03B1 berarti sama pada 2D dan 16 dimensi. Itu pilihan implementasi, bukan bagian rumus asli. (2) Yang (2010) menulis kecepatan dengan (x_i \u2212 x*). Di sini dibalik menjadi (x* \u2212 x_i) agar kelelawar bergerak mendekati x*, sesuai deskripsi. Cek ke sumber asli sebelum menulis laporan.</p>`,
    mount(container, ctx) {
      return mountStory(container, ctx, {
        tag: "7 \xB7 Model matematis",
        beats: [
          { title: "Persamaannya, sekarang masuk akal", sub: "Jarak dan pengukuran dulu." },
          { title: "Daya tarik dan frekuensi", sub: "Dua mesin pengatur arah." },
          { title: "Terbang dan menjelajah", sub: "Aturan gerak masing-masing." },
          { title: "Goyang acak dan seleksi", sub: "Penjaga keragaman dan pengunci hasil." }
        ],
        draw: drawEquations
      });
    }
  };
  var modelSlides = [modelFitness, modelPersamaan];

  // src/slides/cloudSlides.js
  var TASK_SEED = 2026;
  var PIPELINE = ["Tugas masuk", "Kandidat jadwal", "Hitung makespan", "FA atau BA menggeser", "Kirim ke VM"];
  var kasusKode = {
    id: "kasus-kode",
    chapter: CH.cloud,
    title: "Cloud: tugas masuk ke VM",
    notes: `
    <p>Alur lengkapnya, dari tugas masuk sampai dikirim ke VM:</p>
    <ol>
      <li>Tugas datang ke penjadwal (di sini 16 tugas independen).</li>
      <li>Penjadwal membuat banyak kandidat jadwal sekaligus. Itulah populasi kunang-kunang atau kelelawar.</li>
      <li>Setiap kandidat didekode menjadi penugasan tugas ke VM, lalu dinilai dengan makespan.</li>
      <li>FA atau BA menggeser kandidat berdasarkan nilai itu, berulang-ulang.</li>
      <li>Setelah iterasi habis, jadwal terbaik dikirim: tiap tugas dijalankan di VM pilihannya.</li>
    </ol>
    <p><b>Interaksi:</b> klik sebuah tugas untuk memindahkannya ke VM berikutnya. Coba kalahkan Round-Robin dengan tangan, lalu tekan tombol Hasil FA atau Hasil BA untuk melihat jadwal yang ditemukan algoritma pada beban kerja yang sama.</p>
    <p>Penugasan manual adalah contoh bahwa ruang pencarian besar: 4 pangkat 16 kemungkinan. Algoritma mencari dengan beberapa ratus evaluasi saja.</p>`,
    mount(container, { registerHooks }) {
      const tasks = generateTasks(16, TASK_SEED);
      const vms = makeVMs(4);
      const rr = roundRobin(tasks, vms);
      const mm = minMin(tasks, vms);
      const ideal = idealMakespan(tasks, vms);
      let assignment = rr.assignment.slice();
      let moves = 0;
      let solved = null;
      const LABEL_W = 214;
      const LANE_H = 100;
      const GAP = 12;
      const TOP = 34;
      const lanesH = vms.length * LANE_H + (vms.length - 1) * GAP;
      container.innerHTML = `
      <div class="kode">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>8 \xB7 Penerapan di cloud</span>
          <h1 class="plate-title">Tugas masuk, VM menerima, lalu?</h1>
        </header>

        <ol class="relay">${PIPELINE.map((p, i) => `<li style="--i:${i}"><span>${i + 1}</span>${p}</li>`).join("")}</ol>

        <div class="tiles">
          <div class="tile tile-big"><small>Makespan jadwalmu</small><strong id="play-make">0</strong></div>
          <div class="tile tile-verdict"><small>Penilaian</small><p id="play-verdict"></p></div>
          <div class="tile"><small>Round-Robin</small><b id="f-rr"></b></div>
          <div class="tile"><small>Min-Min</small><b id="f-mm"></b></div>
          <div class="tile"><small>Batas ideal</small><b id="f-id"></b></div>
          <div class="tile"><small>Pemindahan</small><b id="f-mv">0</b></div>
        </div>

        <div class="lanes" id="lanes" style="height:${TOP + lanesH}px">
          ${vms.map(
        (vm, j) => `<div class="lane" style="top:${TOP + j * (LANE_H + GAP)}px;height:${LANE_H}px">
                <div class="lane-name" style="width:${LABEL_W - 14}px"><b>${vm.name}</b><span>${vm.mips} MIPS</span><em id="load-${j}"></em></div>
                <div class="lane-track" style="left:${LABEL_W}px"></div></div>`
      ).join("")}
          <div class="mark mark-ideal" id="mark-ideal"><i>ideal</i></div>
          <div class="mark mark-make" id="mark-make"><i id="mark-make-label">makespan</i></div>
          ${tasks.map(
        (t) => `<button type="button" class="chip" data-id="${t.id}" style="background:${taskColor(t.id)}" aria-label="Tugas ${t.name}, pindahkan ke VM berikutnya"><b>${t.name}</b><span>${t.mi}</span></button>`
      ).join("")}
        </div>
        <p class="kode-hint">Klik blok tugas untuk memindahkannya ke VM berikutnya. Lebar blok = waktu eksekusi (MI \xF7 MIPS).</p>

        <div class="dock dock-kode">
          <button type="button" class="dock-btn" data-act="rr"><span>Round-Robin</span></button>
          <button type="button" class="dock-btn" data-act="random"><span>Acak</span><kbd>R</kbd></button>
          <button type="button" class="dock-btn" data-act="mm"><span>Min-Min</span></button>
          <i class="dock-sep"></i>
          <button type="button" class="dock-btn dock-fa" data-act="fa"><span>Hasil Firefly</span></button>
          <button type="button" class="dock-btn dock-ba" data-act="ba"><span>Hasil Bat</span></button>
        </div>
      </div>
    `;
      const $2 = (s) => container.querySelector(s);
      const chips = [...container.querySelectorAll(".chip")];
      const lanesEl = $2("#lanes");
      $2("#f-rr").textContent = `${rr.makespan.toFixed(2)} s`;
      $2("#f-mm").textContent = `${mm.makespan.toFixed(2)} s`;
      $2("#f-id").textContent = `${ideal.toFixed(2)} s`;
      function update() {
        const ev = evaluateAssignment(assignment, tasks, vms);
        const tMax = Math.max(rr.makespan * 1.1, ev.makespan * 1.06);
        const trackW = lanesEl.clientWidth - LABEL_W - 8;
        const px = trackW / tMax;
        const layout = layoutOf(ev);
        chips.forEach((chip) => {
          const l = layout.get(Number(chip.dataset.id));
          chip.style.left = `${LABEL_W + l.start * px}px`;
          chip.style.top = `${TOP + l.lane * (LANE_H + GAP) + 7}px`;
          chip.style.width = `${Math.max(14, l.dur * px - 4)}px`;
          chip.style.height = `${LANE_H - 14}px`;
          chip.classList.toggle("narrow", l.dur * px < 62);
        });
        $2("#mark-make").style.left = `${LABEL_W + ev.makespan * px}px`;
        $2("#mark-ideal").style.left = `${LABEL_W + ideal * px}px`;
        $2("#mark-make-label").textContent = `${ev.makespan.toFixed(1)} s`;
        $2("#play-make").textContent = `${ev.makespan.toFixed(2)} s`;
        $2("#f-mv").textContent = String(moves);
        const better = (1 - ev.makespan / rr.makespan) * 100;
        const verdict2 = $2("#play-verdict");
        if (ev.makespan < mm.makespan - 1e-9) {
          verdict2.textContent = `Mengalahkan Min-Min dan ${better.toFixed(0)}% lebih cepat dari Round-Robin.`;
          verdict2.dataset.state = "great";
        } else if (ev.makespan < rr.makespan - 1e-9) {
          verdict2.textContent = `${better.toFixed(0)}% lebih cepat dari Round-Robin. Min-Min masih ${mm.makespan.toFixed(2)} s.`;
          verdict2.dataset.state = "good";
        } else {
          verdict2.textContent = `Belum mengalahkan Round-Robin (${rr.makespan.toFixed(2)} s). Pindahkan tugas dari VM yang paling penuh.`;
          verdict2.dataset.state = "bad";
        }
        if (solved) verdict2.textContent += ` (${solved})`;
        ev.vmLoads.forEach((load, j) => {
          const el = $2(`#load-${j}`);
          el.textContent = `beban ${load.toFixed(1)} s`;
          el.classList.toggle("max", load === ev.makespan);
        });
      }
      function setAssignment(next, label) {
        assignment = next.slice();
        solved = label || null;
        update();
      }
      chips.forEach((chip) => {
        chip.addEventListener("click", () => {
          const i = Number(chip.dataset.id) - 1;
          assignment[i] = (assignment[i] + 1) % vms.length;
          moves++;
          solved = null;
          update();
        });
      });
      const optimizerBest = {};
      function solveWith(kind) {
        if (!optimizerBest.state) {
          const opt = new CloudScheduleOptimizer({ n: 16, m: 4, tasks, populationSize: 28, maxIterations: 40, seed: 42 });
          optimizerBest.state = opt.run();
        }
        return kind === "fa" ? optimizerBest.state.evalFa.assignment : optimizerBest.state.evalBa.assignment;
      }
      let randomSeed = 1;
      const randomize = () => {
        randomSeed++;
        const next = tasks.map((_, i) => Math.floor(Math.abs(Math.sin(randomSeed * 12.9898 + i * 78.233) * 43758.5453) % 1 * vms.length));
        moves++;
        setAssignment(next, "acak");
      };
      container.querySelectorAll("[data-act]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const act = btn.dataset.act;
          if (act === "rr") setAssignment(rr.assignment, "Round-Robin");
          else if (act === "mm") setAssignment(mm.assignment, "Min-Min");
          else if (act === "random") randomize();
          else setAssignment(solveWith(act), act === "fa" ? "hasil Firefly" : "hasil Bat");
        });
      });
      registerHooks?.({ reset: randomize });
      update();
      const onResize = () => update();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  };
  var GANTT_W = 1130;
  var GANTT_H = 300;
  var CLOUD_PARAMS = [
    { key: "n", label: "Jumlah tugas", min: 8, max: 48, step: 4, value: 16 },
    { key: "m", label: "Jumlah VM", min: 3, max: 8, step: 1, value: 4 },
    { key: "populationSize", label: "Populasi", min: 10, max: 50, step: 2, value: 28 },
    { key: "maxIterations", label: "Iterasi", min: 10, max: 80, step: 5, value: 40 }
  ];
  function logicalCtx(canvas) {
    const { ctx, width, height: height2 } = fitCanvas(canvas);
    ctx.scale(width / GANTT_W, height2 / GANTT_H);
    ctx.clearRect(0, 0, GANTT_W, GANTT_H);
    return ctx;
  }
  var kasusRun = {
    id: "kasus-run",
    chapter: CH.cloud,
    title: "Cloud: FA dan BA menjadwalkan bersama",
    notes: `
    <p>Beban kerja, jumlah VM, populasi awal, dan fungsi objektif (makespan) <b>identik</b> untuk kedua algoritma. Yang berbeda hanya aturan geraknya. Anggaran evaluasi juga sama: satu evaluasi per individu per iterasi.</p>
    <ul>
      <li>Jalur atas Firefly, jalur bawah Bat. Blok yang bergeser antar-VM adalah jadwal terbaik saat ini, bukan seluruh populasi.</li>
      <li>Garis putus-putus emas = makespan terbaik, hijau = batas bawah ideal.</li>
      <li>Grafik di kanan: dua kurva algoritma dibandingkan Round-Robin, Min-Min, dan batas bawah. Kurva tidak pernah naik karena yang dicatat adalah nilai terbaik sejauh ini.</li>
    </ul>
    <p>Tekan <b>Parameter</b> untuk mengubah jumlah tugas, VM, populasi, dan iterasi. Hasil satu proses acak tidak cukup untuk menyimpulkan siapa lebih baik. Itu sebabnya ada eksperimen sepuluh beban kerja di slide hasil.</p>`,
    mount(container, { reducedMotion, registerHooks }) {
      const id = "cr";
      container.innerHTML = `
      <div class="twin" style="--tone:#5eead4">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>8 \xB7 Penerapan di cloud</span>
          <h1 class="plate-title">Beban kerja sama, dua penjadwal</h1>
        </header>

        <div class="gantt gantt-fa">
          <div class="gantt-head"><b>Firefly</b><strong id="${id}-fa-score"></strong><em id="${id}-fa-gain"></em></div>
          <canvas id="${id}-fa"></canvas>
        </div>
        <div class="gantt gantt-ba">
          <div class="gantt-head"><b>Bat</b><strong id="${id}-ba-score"></strong><em id="${id}-ba-gain"></em></div>
          <canvas id="${id}-ba"></canvas>
        </div>

        <aside class="curve-card">
          <small>Konvergensi makespan</small>
          <canvas id="${id}-chart"></canvas>
          <span class="curve-iter" id="${id}-iter"></span>
        </aside>

        <div class="dock">
          ${dockButton(`${id}-play`, ICONS.play, "Mulai", "dock-main")}
          ${dockButton(`${id}-step`, ICONS.step, "Langkah")}
          ${dockButton(`${id}-reset`, ICONS.reset, "Reset")}
          <i class="dock-sep"></i>
          ${dockButton(`${id}-params-toggle`, ICONS.gear, "Parameter")}
        </div>
        ${drawerHtml(id, CLOUD_PARAMS, 2)}
      </div>`;
      const $2 = (s) => container.querySelector(s);
      const faCanvas = $2(`#${id}-fa`);
      const baCanvas = $2(`#${id}-ba`);
      const chartCanvas = $2(`#${id}-chart`);
      const playBtn = $2(`#${id}-play`);
      const paramInputs = [...container.querySelectorAll("[data-param]")];
      const seedInput = $2(`#${id}-seed`);
      const speedInput = $2(`#${id}-speed`);
      wireDrawer(container, id);
      let speed = 2;
      function readConfig() {
        const cfg = { seed: Number(seedInput.value) || 42 };
        for (const input of paramInputs) cfg[input.dataset.param] = Number(input.value);
        return cfg;
      }
      let opt = null;
      let tMax = 1;
      let prevFa = null;
      let prevBa = null;
      let curFa = null;
      let curBa = null;
      let vms = null;
      let tasks = null;
      function build() {
        const cfg = readConfig();
        tasks = generateTasks(cfg.n, TASK_SEED);
        opt = new CloudScheduleOptimizer({
          n: cfg.n,
          m: cfg.m,
          tasks,
          populationSize: cfg.populationSize,
          maxIterations: cfg.maxIterations,
          seed: cfg.seed
        });
        vms = opt.vms;
        const st = opt.getState();
        tMax = Math.max(st.baselineRR.makespan, st.evalFa.makespan, st.evalBa.makespan) * 1.08;
        curFa = layoutOf(st.evalFa);
        curBa = layoutOf(st.evalBa);
        prevFa = curFa;
        prevBa = curBa;
      }
      function chartSeries(st) {
        const max = st.maxIterations;
        const flat = (v) => [
          { iteration: 0, bestFitness: v },
          { iteration: max, bestFitness: v }
        ];
        return [
          { label: "Firefly", color: FA_COLOR, data: st.fa.history },
          { label: "Bat", color: BA_COLOR, data: st.ba.history },
          { label: "Round-Robin", color: COLORS.coral, data: flat(st.baselineRR.makespan), dashed: true, width: 2.4 },
          { label: "Min-Min", color: COLORS.blueLight, data: flat(st.baselineMinMin.makespan), dashed: true, width: 2.4 },
          { label: "ideal", color: COLORS.lime, data: flat(st.ideal), dashed: true, width: 2.4 }
        ];
      }
      function updateReadout() {
        const st = opt.getState();
        $2(`#${id}-fa-score`).textContent = `${st.evalFa.makespan.toFixed(2)} s`;
        $2(`#${id}-ba-score`).textContent = `${st.evalBa.makespan.toFixed(2)} s`;
        const gain = (ev) => `${((1 - ev.makespan / st.baselineRR.makespan) * 100).toFixed(1)}% lebih cepat dari Round-Robin`;
        $2(`#${id}-fa-gain`).textContent = gain(st.evalFa);
        $2(`#${id}-ba-gain`).textContent = gain(st.evalBa);
        $2(`#${id}-iter`).textContent = `iterasi ${st.iteration}/${st.maxIterations}`;
        renderConvergenceChart(chartCanvas, chartSeries(st), {
          maxIterations: st.maxIterations,
          yMin: Math.floor(st.ideal * 0.9),
          decimals: 2
        });
      }
      const ticker = new StepTicker({
        rate: speed,
        calm: reducedMotion,
        onTick: () => {
          prevFa = curFa;
          prevBa = curBa;
          const st = opt.step();
          curFa = layoutOf(st.evalFa);
          curBa = layoutOf(st.evalBa);
          updateReadout();
          return st.done;
        },
        onFrame: (glide) => {
          const st = opt.getState();
          const rect = { x: 10, y: 28, w: GANTT_W - 20, h: GANTT_H - 48 };
          const common = { tMax, ideal: st.ideal, alpha: glide, labelW: 120, fontScale: 0.92, laneColor: COLORS.blue };
          drawSchedule(logicalCtx(faCanvas), rect, tasks, vms, curFa, { ...common, from: prevFa, makespan: st.evalFa.makespan });
          drawSchedule(logicalCtx(baCanvas), rect, tasks, vms, curBa, { ...common, from: prevBa, makespan: st.evalBa.makespan });
        }
      });
      ticker.onRunningChange = (on) => setPlayLabel(playBtn, on);
      const reset = () => {
        ticker.halt();
        build();
        updateReadout();
        ticker.settle();
        ticker.setRate(speed);
      };
      const togglePlay = () => {
        if (opt.done) reset();
        ticker.setRate(speed);
        ticker.toggle();
      };
      const step = () => {
        if (opt.done) return;
        ticker.single();
        ticker.setRate(speed);
      };
      playBtn.addEventListener("click", togglePlay);
      $2(`#${id}-step`).addEventListener("click", step);
      $2(`#${id}-reset`).addEventListener("click", reset);
      for (const input of paramInputs) {
        input.addEventListener("input", () => {
          $2(`#${id}-v-${input.dataset.param}`).textContent = input.value;
          reset();
        });
      }
      seedInput.addEventListener("change", reset);
      speedInput.addEventListener("input", () => {
        speed = Number(speedInput.value);
        $2(`#${id}-v-speed`).textContent = speedInput.value;
        ticker.setRate(speed);
      });
      registerHooks?.({ togglePlay, step, reset });
      build();
      updateReadout();
      const onResize = () => updateReadout();
      window.addEventListener("resize", onResize);
      ticker.attach();
      return () => {
        window.removeEventListener("resize", onResize);
        ticker.dispose();
      };
    }
  };
  var cloudSlides = [kasusKode, kasusRun];

  // src/slides/hasilSlides.js
  var ADU_PARAMS = [
    { key: "populationSize", label: "Populasi", min: 8, max: 40, step: 1, value: 20 },
    { key: "maxIterations", label: "Iterasi", min: 10, max: 60, step: 5, value: 30 }
  ];
  var aduSlide = {
    id: "adu",
    chapter: CH.hasil,
    title: "Adu: Firefly vs Bat di peta yang sama",
    notes: `
    <p>Syarat perbandingan yang adil sudah dipenuhi: <b>fungsi sama, posisi awal sama persis, populasi sama, iterasi sama</b>. Anggaran evaluasi juga sama (satu per individu per iterasi), terlihat dari angka evaluasi di bawah skor.</p>
    <ul>
      <li>Kedua mesin berjalan serempak: tiga tahap per iterasi untuk masing-masing.</li>
      <li>Ganti fungsi (Rastrigin, Ackley, Sphere) untuk melihat karakter berbeda: Sphere cepat sekali, Rastrigin penuh jebakan.</li>
      <li>Ubah seed lewat tombol Parameter. Pemenang dapat berganti dari seed ke seed. Satu proses acak bukan kesimpulan.</li>
    </ul>
    <p>Itu sebabnya slide berikutnya memakai banyak beban kerja sekaligus.</p>`,
    mount(container, { reducedMotion, registerHooks }) {
      const id = "adu";
      container.innerHTML = `
      <div class="versus">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>9 \xB7 Perbandingan hasil</span>
          <h1 class="plate-title">Posisi awal sama, gerak beda</h1>
        </header>

        <div class="arena arena-fa">
          <canvas id="${id}-fa"></canvas>
          <div class="scoreboard"><b>Firefly</b><strong id="${id}-fa-score"></strong><em id="${id}-fa-eval"></em></div>
        </div>
        <div class="arena arena-ba">
          <canvas id="${id}-ba"></canvas>
          <div class="scoreboard"><b>Bat</b><strong id="${id}-ba-score"></strong><em id="${id}-ba-eval"></em></div>
        </div>
        <div class="versus-badge" aria-hidden="true">VS</div>

        <section class="strip-chart">
          <small>Konvergensi bersama</small>
          <canvas id="${id}-chart"></canvas>
          <span class="curve-iter" id="${id}-iter"></span>
        </section>

        <div class="dock">
          ${dockButton(`${id}-play`, ICONS.play, "Mulai", "dock-main")}
          ${dockButton(`${id}-step`, ICONS.step, "Langkah")}
          ${dockButton(`${id}-reset`, ICONS.reset, "Reset")}
          <i class="dock-sep"></i>
          <div class="seg" id="${id}-objectives">${objectiveButtonsHtml("rastrigin")}</div>
          <i class="dock-sep"></i>
          ${dockButton(`${id}-params-toggle`, ICONS.gear, "Parameter")}
        </div>
        ${drawerHtml(id, ADU_PARAMS, 3)}
      </div>`;
      const $2 = (s) => container.querySelector(s);
      const faCanvas = $2(`#${id}-fa`);
      const baCanvas = $2(`#${id}-ba`);
      const chartCanvas = $2(`#${id}-chart`);
      const playBtn = $2(`#${id}-play`);
      const seedInput = $2(`#${id}-seed`);
      const speedInput = $2(`#${id}-speed`);
      const paramInputs = [...container.querySelectorAll("[data-param]")];
      const objectiveBtns = [...container.querySelectorAll(`#${id}-objectives .seg-btn`)];
      wireDrawer(container, id);
      const faRenderer2 = new FARenderer();
      const baRenderer2 = new BARenderer();
      let objective = landscapeById("rastrigin");
      let speed = 3;
      let fa = null;
      let ba = null;
      function readConfig() {
        const cfg = { seed: Number(seedInput.value) || 42 };
        for (const input of paramInputs) cfg[input.dataset.param] = Number(input.value);
        return cfg;
      }
      function build() {
        const cfg = readConfig();
        const rng = createRandom(cfg.seed + 7);
        const initial = Array.from({ length: cfg.populationSize }, () => [
          rng.range(objective.min, objective.max),
          rng.range(objective.min, objective.max)
        ]);
        const common = {
          dim: 2,
          lo: objective.min,
          hi: objective.max,
          fitness: (x) => objective.evaluate(x[0], x[1]),
          populationSize: cfg.populationSize,
          maxIterations: cfg.maxIterations,
          seed: cfg.seed,
          initial
        };
        fa = new FAEngine(common);
        ba = new BAEngine(common);
      }
      function updateReadout() {
        const a = fa.getState();
        const b = ba.getState();
        $2(`#${id}-fa-score`).textContent = formatFitness(a.best.fitness);
        $2(`#${id}-ba-score`).textContent = formatFitness(b.best.fitness);
        $2(`#${id}-fa-eval`).textContent = `${a.evaluations} evaluasi`;
        $2(`#${id}-ba-eval`).textContent = `${b.evaluations} evaluasi`;
        $2(`#${id}-iter`).textContent = `iterasi ${a.iteration}/${a.maxIterations}`;
        renderConvergenceChart(
          chartCanvas,
          [
            { label: "Firefly", color: FA_COLOR, data: a.history },
            { label: "Bat", color: BA_COLOR, data: b.history }
          ],
          { maxIterations: a.maxIterations, decimals: 3 }
        );
      }
      const ticker = new StepTicker({
        rate: speed,
        calm: reducedMotion,
        onTick: () => {
          const a = fa.step();
          const b = ba.step();
          updateReadout();
          return a.phase === "DONE" && b.phase === "DONE";
        },
        onFrame: (glide, now) => {
          const ts = reducedMotion ? 0 : now;
          faRenderer2.render(faCanvas, fa.getState(), objective, { alpha: glide, timestamp: ts, padding: 0.04 });
          baRenderer2.render(baCanvas, ba.getState(), objective, { alpha: glide, timestamp: ts, padding: 0.04 });
        }
      });
      ticker.onRunningChange = (on) => setPlayLabel(playBtn, on);
      const reset = () => {
        ticker.halt();
        build();
        updateReadout();
        ticker.settle();
        ticker.setRate(speed);
      };
      const togglePlay = () => {
        if (fa.done && ba.done) reset();
        ticker.setRate(speed);
        ticker.toggle();
      };
      const step = () => {
        if (fa.done && ba.done) return;
        ticker.single();
        ticker.setRate(speed);
      };
      playBtn.addEventListener("click", togglePlay);
      $2(`#${id}-step`).addEventListener("click", step);
      $2(`#${id}-reset`).addEventListener("click", reset);
      objectiveBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          objectiveBtns.forEach((b) => b.classList.toggle("active", b === btn));
          objective = landscapeById(btn.dataset.obj);
          reset();
        });
      });
      for (const input of paramInputs) {
        input.addEventListener("input", () => {
          $2(`#${id}-v-${input.dataset.param}`).textContent = input.value;
          reset();
        });
      }
      seedInput.addEventListener("change", reset);
      speedInput.addEventListener("input", () => {
        speed = Number(speedInput.value);
        $2(`#${id}-v-speed`).textContent = speedInput.value;
        ticker.setRate(speed);
      });
      registerHooks?.({ togglePlay, step, reset });
      build();
      updateReadout();
      const onResize = () => updateReadout();
      window.addEventListener("resize", onResize);
      ticker.attach();
      return () => {
        window.removeEventListener("resize", onResize);
        ticker.dispose();
      };
    }
  };
  var METHODS = [
    { key: "rr", label: "Round-Robin", color: COLORS.coral },
    { key: "minmin", label: "Min-Min", color: COLORS.blueLight },
    { key: "fa", label: "Firefly", color: FA_COLOR },
    { key: "ba", label: "Bat", color: BA_COLOR }
  ];
  var EXP_W = 1660;
  var EXP_H = 520;
  function drawExperimentChart(canvas, rows, total) {
    const { ctx, width, height: height2 } = fitCanvas(canvas);
    ctx.scale(width / EXP_W, height2 / EXP_H);
    ctx.clearRect(0, 0, EXP_W, EXP_H);
    const padL = 84;
    const padR = 20;
    const padT = 56;
    const padB = 56;
    const pw = EXP_W - padL - padR;
    const ph = EXP_H - padT - padB;
    let maxRatio = 1.4;
    rows.forEach((r) => METHODS.forEach((m) => maxRatio = Math.max(maxRatio, r[m.key] / r.ideal)));
    maxRatio = Math.ceil(maxRatio * 10) / 10 + 0.05;
    const y = (v) => padT + ph - (v - 1) / (maxRatio - 1) * ph;
    ctx.font = '600 21px "Red Hat Mono", "Manrope", monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let v = 1; v <= maxRatio + 1e-9; v += 0.2) {
      ctx.strokeStyle = Math.abs(v - 1) < 1e-9 ? hexToRgba(COLORS.lime, 0.8) : "rgba(169,187,214,0.18)";
      ctx.lineWidth = Math.abs(v - 1) < 1e-9 ? 3 : 1.5;
      ctx.setLineDash(Math.abs(v - 1) < 1e-9 ? [4, 8] : []);
      ctx.beginPath();
      ctx.moveTo(padL, y(v));
      ctx.lineTo(padL + pw, y(v));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = Math.abs(v - 1) < 1e-9 ? COLORS.lime : COLORS.muted;
      ctx.fillText(`${v.toFixed(1)}\xD7`, padL - 12, y(v));
    }
    ctx.textAlign = "left";
    ctx.font = '700 23px "Manrope", sans-serif';
    let lx = padL;
    METHODS.forEach((m) => {
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.roundRect(lx, 14, 22, 22, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(m.label, lx + 32, 26);
      lx += ctx.measureText(m.label).width + 72;
    });
    ctx.fillStyle = COLORS.lime;
    ctx.fillText("1.0\xD7 = batas bawah ideal", lx + 10, 26);
    const groupW = pw / total;
    const barW = Math.min(36, (groupW - 16) / METHODS.length);
    rows.forEach((r, gi) => {
      const gx = padL + gi * groupW + (groupW - barW * METHODS.length) / 2;
      METHODS.forEach((m, mi) => {
        const v = r[m.key] / r.ideal;
        const top = y(v);
        const grad = ctx.createLinearGradient(0, top, 0, y(1));
        grad.addColorStop(0, m.color);
        grad.addColorStop(1, hexToRgba(m.color, 0.35));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(gx + mi * barW, top, barW - 3, Math.max(2, y(1) - top), 6);
        ctx.fill();
      });
      drawText(ctx, `W${r.workload}`, padL + gi * groupW + groupW / 2, EXP_H - 26, { size: 22, color: COLORS.muted, align: "center", mono: true, weight: 600 });
    });
  }
  function verdict(sum) {
    const faR = sum.ratio.fa;
    const baR = sum.ratio.ba;
    const diff = Math.abs(faR - baR) / Math.min(faR, baR);
    const lead = faR < baR ? "Firefly" : "Bat";
    if (diff < 0.01) {
      return `Selisih rata-rata Firefly dan Bat kurang dari 1% (${faR.toFixed(3)}\xD7 vs ${baR.toFixed(3)}\xD7): praktis seimbang pada beban kerja ini.`;
    }
    return `${lead} rata-rata lebih rapat ke batas bawah (${faR.toFixed(3)}\xD7 vs ${baR.toFixed(3)}\xD7), selisih ${(diff * 100).toFixed(1)}%. Lihat jumlah kemenangan sebelum menyimpulkan.`;
  }
  var eksperimenSlide = {
    id: "eksperimen",
    chapter: CH.hasil,
    title: "Eksperimen sepuluh beban kerja",
    notes: `
    <p>Satu proses acak tidak cukup untuk menyimpulkan. Di sini algoritma dijalankan pada sepuluh beban kerja berbeda (panjang tugas diacak dengan seed berbeda), semuanya dihitung langsung di browser Anda saat tombol ditekan.</p>
    <ul>
      <li>Sumbu tegak adalah <b>rasio terhadap batas bawah ideal</b>: 1,0\xD7 berarti sempurna (instruksi terbagi mulus sesuai kecepatan VM, yang hampir mustahil dicapai karena tugas tidak bisa dipecah).</li>
      <li>Round-Robin dan Min-Min adalah pembanding klasik. Min-Min mengikuti Braun dkk. (2001), baseline yang juga dipakai paper Firefly.</li>
      <li>Ubah jumlah tugas atau VM, lalu jalankan lagi. Tombol "Seed baru" mengulang eksperimen dengan populasi awal berbeda untuk melihat variasi.</li>
    </ul>
    <p>Baca hasil dengan jujur: bila selisih FA dan BA kecil dan kemenangan seimbang, kesimpulannya bukan "A lebih baik dari B". Ini simulasi sederhana: tugas independen, tanpa biaya komunikasi atau antrean.</p>`,
    mount(container, { registerHooks }) {
      const state = { n: 16, m: 4, seedBase: 42, rows: [], token: 0, timer: null };
      container.innerHTML = `
      <div class="trial">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>9 \xB7 Perbandingan hasil</span>
          <h1 class="plate-title">Sepuluh beban kerja, empat penjadwal</h1>
        </header>
        <div class="scores" id="exp-cards"></div>
        <div class="trial-chart"><canvas id="exp-chart"></canvas></div>
        <p class="trial-verdict" id="exp-verdict"></p>
        <div class="dock dock-trial">
          ${dockButton("exp-run", ICONS.play, "Jalankan", "dock-main")}
          ${dockButton("exp-seed", ICONS.reset, "Seed baru")}
          <i class="dock-sep"></i>
          <div class="seg" id="exp-n"><button type="button" class="seg-btn" data-n="8">8 tugas</button><button type="button" class="seg-btn active" data-n="16">16 tugas</button><button type="button" class="seg-btn" data-n="32">32 tugas</button></div>
          <i class="dock-sep"></i>
          <div class="seg" id="exp-m"><button type="button" class="seg-btn active" data-m="4">4 VM</button><button type="button" class="seg-btn" data-m="6">6 VM</button><button type="button" class="seg-btn" data-m="8">8 VM</button></div>
        </div>
      </div>`;
      const $2 = (s) => container.querySelector(s);
      const canvas = $2("#exp-chart");
      function renderSide() {
        const rows = state.rows;
        const cards = $2("#exp-cards");
        if (!rows.length) {
          cards.innerHTML = METHODS.map((m) => `<div class="score-card idle" style="--c:${m.color}"><span>${m.label}</span><b>\u2026</b><em>menunggu hitungan</em></div>`).join("");
          $2("#exp-verdict").textContent = "";
          return;
        }
        const sum = summarizeExperiment(rows);
        cards.innerHTML = METHODS.map((m) => {
          const gain = (1 - sum.avg[m.key] / sum.avg.rr) * 100;
          return `<div class="score-card" style="--c:${m.color}">
          <span>${m.label}</span>
          <b>${sum.ratio[m.key].toFixed(3)}\xD7</b>
          <em>${m.key === "rr" ? "pembanding dasar" : `${gain.toFixed(1)}% lebih cepat dari Round-Robin`}</em>
        </div>`;
        }).join("");
        const done = rows.length === 10;
        const wins = `Firefly menang ${sum.faWins}, Bat menang ${sum.baWins}${sum.ties ? `, seri ${sum.ties}` : ""} dari ${sum.count} beban kerja.`;
        $2("#exp-verdict").textContent = done ? `${wins} ${verdict(sum)}` : `Menghitung beban kerja ${rows.length}/10 \u2026`;
      }
      function draw() {
        drawExperimentChart(canvas, state.rows, 10);
      }
      function run() {
        state.token++;
        const token = state.token;
        clearTimeout(state.timer);
        state.rows = [];
        renderSide();
        draw();
        const next = (w) => {
          if (token !== state.token || w >= 10) return;
          state.rows.push(runWorkload(w, { n: state.n, m: state.m, seed: state.seedBase }));
          renderSide();
          draw();
          state.timer = setTimeout(() => next(w + 1), 170);
        };
        state.timer = setTimeout(() => next(0), 120);
      }
      $2("#exp-run").addEventListener("click", run);
      $2("#exp-seed").addEventListener("click", () => {
        state.seedBase += 101;
        run();
      });
      container.querySelectorAll("#exp-n .seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          container.querySelectorAll("#exp-n .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
          state.n = Number(btn.dataset.n);
          run();
        });
      });
      container.querySelectorAll("#exp-m .seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          container.querySelectorAll("#exp-m .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
          state.m = Number(btn.dataset.m);
          run();
        });
      });
      const onResize = () => draw();
      window.addEventListener("resize", onResize);
      registerHooks?.({ togglePlay: run, reset: () => $2("#exp-seed").click() });
      run();
      return () => {
        state.token++;
        clearTimeout(state.timer);
        window.removeEventListener("resize", onResize);
      };
    }
  };
  var hasilSlides = [aduSlide, eksperimenSlide];

  // src/slides/penutupSlides.js
  var cachedSummary = null;
  function liveSummary() {
    if (!cachedSummary) cachedSummary = summarizeExperiment(runExperiment({ n: 16, m: 4, workloads: 10 }));
    return cachedSummary;
  }
  var ROWS = [
    ["Inspirasi", "Kunang-kunang yang berkedip", "Kelelawar yang berekolokasi"],
    ["Siapa memandu gerak", "Semua yang lebih terang", "Satu yang terbaik, x*"],
    ["Pengatur jelajah", "\u03B3 (peredam jarak), \u03B1 (langkah acak)", "A (kenyaringan), r (laju pulsa)"],
    ["Menuju akhir", "\u03B1 menyusut tiap iterasi", "A turun tiap penerimaan"],
    ["Perbandingan per iterasi", "N \xD7 N pasangan", "N, hanya ke x*"],
    ["Evaluasi per iterasi", "N", "N (sama)"]
  ];
  var ringkasSlide = {
    id: "ringkas",
    chapter: CH.penutup,
    title: "Ringkasan: dua cara berpikir",
    notes: `
    <p>Satu kalimat per baris.</p>
    <ul>
      <li><b>Memandu gerak.</b> Firefly: tiap individu mengincar semua yang lebih baik, tarikan memudar dengan jarak, sehingga bisa terbentuk beberapa kelompok. Bat: semua mengincar satu pemimpin, x*, sehingga cenderung satu kelompok.</li>
      <li><b>Biaya.</b> Firefly membandingkan semua pasangan (N kali N) per iterasi, jadi lebih mahal bila populasi besar. Bat cukup N. Jumlah evaluasi fungsi tujuan sama, yang biasanya jadi komponen mahal bila fungsinya berat.</li>
      <li><b>Parameter.</b> Firefly: \u03B2\u2080, \u03B3, \u03B1. Bat: f, A\u2080, r\u2080, \u03B1_A, \u03B3_r. Bat memiliki lebih banyak knob, sehingga lebih repot dituning.</li>
    </ul>
    <p>Baris terakhir adalah angka hidup yang dihitung langsung di browser dari sepuluh beban kerja (16 tugas, 4 VM). Nilai bisa sedikit berbeda dengan tampilan eksperimen bila pengaturannya diubah.</p>`,
    mount(container) {
      container.innerHTML = `
      <div class="duo">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>10 \xB7 Kesimpulan</span>
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
      ).join("")}
          <div class="duo-row duo-live" style="--i:${ROWS.length}">
            <em>Rata-rata makespan \xF7 batas bawah (10 beban kerja, 16 tugas, 4 VM)</em>
            <p class="duo-cell duo-fa" id="live-fa">\u2026</p>
            <p class="duo-cell duo-ba" id="live-ba">\u2026</p>
          </div>
        </div>
      </div>`;
      const timer = setTimeout(() => {
        const sum = liveSummary();
        const fa = container.querySelector("#live-fa");
        const ba = container.querySelector("#live-ba");
        if (fa) fa.textContent = `${sum.ratio.fa.toFixed(3)}\xD7`;
        if (ba) ba.textContent = `${sum.ratio.ba.toFixed(3)}\xD7`;
      }, 650);
      return () => clearTimeout(timer);
    }
  };
  function conclusionLines(sum) {
    const diff = Math.abs(sum.ratio.fa - sum.ratio.ba) / Math.min(sum.ratio.fa, sum.ratio.ba);
    const lead = sum.ratio.fa < sum.ratio.ba ? "Firefly" : "Bat";
    return [
      {
        big: `${sum.gainFaVsRR.toFixed(0)}% dan ${sum.gainBaVsRR.toFixed(0)}%`,
        text: "lebih cepat dari Round-Robin. Firefly dan Bat sama-sama jauh lebih baik daripada membagi bergiliran."
      },
      {
        big: `${sum.ratio.fa.toFixed(2)}\xD7 vs ${sum.ratio.ba.toFixed(2)}\xD7`,
        text: diff < 0.01 ? "dari batas bawah ideal. Selisih keduanya di bawah 1%, jadi tidak ada pemenang yang meyakinkan." : `dari batas bawah ideal. ${lead} sedikit lebih rapat (selisih ${(diff * 100).toFixed(1)}%), dengan kemenangan Firefly ${sum.faWins} dan Bat ${sum.baWins} dari ${sum.count} beban kerja.`
      },
      {
        big: "Pilih sesuai konteks",
        text: "Firefly lebih mahal per iterasi karena membandingkan semua pasangan. Bat lebih ringan tetapi punya lebih banyak parameter. Keduanya bergantung pada pengaturan parameter."
      }
    ];
  }
  var penutupSlide = {
    id: "penutup",
    chapter: CH.penutup,
    title: "Kesimpulan",
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
          <span class="plate-tag"><i></i>10 \xB7 Kesimpulan</span>
          <h1 class="plate-title">Dua pencari dari alam, satu masalah cloud</h1>
        </header>
        <div class="verdicts" id="finale-grid"><p class="verdict-wait">Menghitung \u2026</p></div>
        <p class="limits"><b>Batasan.</b> Tugas independen, VM tetap, tanpa antrean dan biaya komunikasi. Decoding memakai pembulatan (paper Firefly memakai SPV). Sepuluh beban kerja bukan uji statistik. Metrik tunggal: makespan.</p>
      </div>`;
      const timer = setTimeout(() => {
        const grid = container.querySelector("#finale-grid");
        if (!grid) return;
        grid.innerHTML = conclusionLines(liveSummary()).map((c, i) => `<article class="verdict" style="--i:${i}"><span>${i + 1}</span><strong>${c.big}</strong><p>${c.text}</p></article>`).join("");
      }, 80);
      return () => clearTimeout(timer);
    }
  };
  var REFS = [
    {
      badge: "ref-badge-fa",
      tag: "Firefly (aplikasi)",
      year: "2011",
      title: "Scheduling jobs on grid computing using Firefly Algorithm",
      cite: "Yousif, A., Abdullah, A. H., Nor, S. M., &amp; Abdelaziz, A. A. <em>Journal of Theoretical and Applied Information Technology</em>, 33(2). jatit.org/volumes/Vol33No2/3Vol33No2.pdf",
      impl: "<strong>Dipakai untuk:</strong> penerapan FA pada penjadwalan job (aturan SPV, pembanding Min-Min dan Max-Min). Penelitian pada <em>grid</em>, bukan cloud."
    },
    {
      badge: "ref-badge-ba",
      tag: "Bat (aplikasi)",
      year: "2015",
      title: "Bat algorithm for scheduling workflow applications in cloud",
      cite: "Raghavan, S., Sarwesh, P., Marimuthu, C., &amp; Chandrasekaran, K. <em>2015 Int. Conf. on Electronic Design, Computer Networks &amp; Automated Verification (EDCAV)</em>, 139\u2013144. ieeexplore.ieee.org/document/7060555",
      impl: "<strong>Dipakai untuk:</strong> konteks BA pada workflow cloud. <strong>Catatan:</strong> hanya abstrak dan metadata yang diverifikasi saat menyusun deck ini. Baca teks lengkap sebelum mengutip hasilnya."
    },
    {
      badge: "ref-badge-fa",
      tag: "Firefly (asal)",
      year: "2009",
      title: "Firefly algorithms for multimodal optimization",
      cite: "Yang, X.-S. <em>Stochastic Algorithms: Foundations and Applications (SAGA 2009)</em>, LNCS 5792, 169\u2013178. Springer.",
      impl: "<strong>Dipakai untuk:</strong> kecerahan, daya tarik \u03B2\u2080e^(\u2212\u03B3r\xB2), dan aturan gerak. Periksa halaman dan penerbit sebelum masuk daftar pustaka laporan."
    },
    {
      badge: "ref-badge-ba",
      tag: "Bat (asal)",
      year: "2010",
      title: "A new metaheuristic bat-inspired algorithm",
      cite: "Yang, X.-S. <em>Nature Inspired Cooperative Strategies for Optimization (NICSO 2010)</em>, SCI 284, 65\u201374. Springer.",
      impl: "<strong>Dipakai untuk:</strong> frekuensi, kecepatan, kenyaringan A, dan laju pulsa r. Tanda kecepatan di deck ini dibalik agar menuju x*; cek ke sumber asli."
    },
    {
      badge: "ref-badge-bench",
      tag: "Pembanding",
      year: "2001",
      title: "A comparison of eleven static heuristics for mapping a class of independent tasks onto heterogeneous distributed computing systems",
      cite: "Braun, T. D., et al. <em>Journal of Parallel and Distributed Computing</em>, 61(6), 810\u2013837.",
      impl: "<strong>Dipakai untuk:</strong> definisi Min-Min sebagai pembanding klasik. Periksa daftar penulis lengkap sebelum mengutip."
    },
    {
      badge: "ref-badge-cloud",
      tag: "Model & kode",
      year: "2026",
      title: "Simulator makespan pada VM heterogen",
      cite: "Dibuat untuk presentasi ini. Tugas independen, waktu = MI \xF7 MIPS, makespan = beban VM terbesar. Kode sumber terbuka di folder <em>src/algorithms</em>.",
      impl: "<strong>Penting:</strong> angka yang tampil adalah hasil simulasi ini, bukan angka dari paper di atas."
    }
  ];
  var pustakaSlide = {
    id: "pustaka",
    chapter: CH.penutup,
    title: "Sumber dan pustaka",
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
      ).join("")}
        </div>
      </div>`;
    }
  };
  var penutupSlides = [ringkasSlide, penutupSlide, pustakaSlide];

  // src/slides/naskah.js
  var NASKAH = {
    judul: [
      "Halo semuanya. Hari ini saya akan membahas dua algoritma yang terinspirasi dari alam, yaitu Firefly Algorithm dan Bat Algorithm, dan bagaimana keduanya dipakai untuk menjadwalkan tugas di cloud. Sebelum masuk ke rumus, kita lihat dulu gambarnya. Tiap konsep akan saya tunjukkan lewat animasi dan simulasi yang bisa dijalankan langsung di slide ini."
    ],
    masalah: [
      "Bayangkan ada enam belas tugas dengan panjang yang berbeda-beda, lalu ada empat mesin virtual yang kecepatannya juga tidak sama, dari 85 sampai 175 MIPS. Pertanyaan intinya sederhana. Tugas mana sebaiknya ditaruh di mesin mana. Waktu kerja satu tugas dihitung dari panjang tugas dibagi kecepatan mesin.",
      "Cara paling gampang adalah Round-Robin, yaitu tugas dibagi bergiliran. Kelihatannya adil karena jumlahnya sama, tapi mesin yang paling lambat ikut kebagian jatah yang sama sehingga selesai paling akhir. Waktu selesai mesin terakhir inilah yang kita sebut makespan. Di sini Round-Robin berada sekitar 51 persen di atas batas bawah ideal, yaitu garis hijau.",
      "Mungkin ada yang berpikir, coba saja semua kemungkinan. Masalahnya, tiap tugas punya empat pilihan mesin, jadi setiap tugas tambahan melipatkan jumlah jadwal empat kali. Pohon ini baru sampai tugas keempat dan sudah ada dua ratus lima puluh enam cabang. Untuk enam belas tugas, jumlahnya sekitar 4,3 miliar jadwal. Kalau satu jadwal dicek dalam satu milidetik, kita butuh hampir lima puluh hari nonstop. Karena itu kita perlu pencari yang cerdas, bukan pencoba semua."
    ],
    lanskap: [
      "Sekarang bayangkan setiap jadwal sebagai satu titik di pegunungan, dan tingginya adalah waktu selesai. Pencari tunggal yang hanya mau turun akan berhenti di lembah terdekat. Itu yang disebut optimum lokal, sementara lembah yang lebih dalam tidak pernah ia lihat.",
      "Metaheuristik memakai banyak pencari sekaligus dan membuat mereka saling memberi kabar. Satu pencari yang beruntung menemukan lembah yang dalam, lalu yang lain ikut bergerak ke sana.",
      "Kuncinya ada di keseimbangan. Di awal kita menjelajah seluas mungkin supaya tidak terjebak, dan di akhir kita menelusuri dengan teliti supaya hasilnya rapi. Firefly dan Bat mengatur keseimbangan ini dengan cara yang berbeda, dan itulah inti perbandingan kita hari ini."
    ],
    "fa-inspirasi": [
      "Firefly Algorithm terinspirasi dari kunang-kunang yang berkedip untuk saling memanggil. Di algoritma ini, satu kunang-kunang mewakili satu kandidat jadwal.",
      "Terang redupnya cahaya mewakili kualitas solusi. Semakin bagus jadwalnya, semakin terang kunang-kunangnya. Jadi kecerahan di sini bukan sekadar hiasan.",
      "Aturan mainnya, yang redup terbang mengejar yang lebih terang. Semakin jauh jaraknya, semakin lemah tarikannya, sama seperti cahaya yang memudar di kejauhan."
    ],
    "fa-karakter": [
      "Ada tiga tombol pengatur di Firefly. Beta nol menentukan kuat tarikan saat jaraknya nol. Gamma menentukan seberapa cepat tarikan hilang karena jarak. Alpha mengatur lebar langkah acak setelah terbang. Saya geser slider-nya sekarang, dan kurva serta peragaan geraknya langsung ikut berubah. Kursor bisa digerakkan di grafik untuk memilih jarak tertentu."
    ],
    "fa-cara": [
      "Langkah pertama, setiap kunang-kunang dihitung nilai fungsi tujuannya. Pada kasus kita nilainya makespan, dan makin kecil berarti makin terang.",
      "Langkah kedua, setiap kunang-kunang yang redup melihat semua yang lebih terang darinya, lalu mengincar mereka sekaligus.",
      "Langkah ketiga, tarikan melemah karena jarak. Tebal garis di layar menunjukkan kuat tarikan beta. Yang dekat menarik kuat, yang jauh hanya samar.",
      "Langkah terakhir, kunang-kunang terbang mengikuti tarikan lalu bergoyang sedikit secara acak. Tarikan memberi arah, sedangkan langkah acak menjaga agar pencarian tetap menjelajah."
    ],
    "fa-sim": [
      "Sekarang kita coba langsung. Tombol Mulai menjalankan animasi, Langkah maju satu tahap, dan Reset mengulang dari awal. Di kanan ada nilai terbaik dan grafik konvergensi. Saya bisa mengganti fungsi uji di dock bawah, dan membuka laci Parameter untuk mengubah parameter algoritma, jumlah populasi, kecepatan, sampai seed acaknya."
    ],
    "ba-inspirasi": [
      "Bat Algorithm terinspirasi dari kelelawar yang berekolokasi. Kelelawar bersuara, lalu mendengar gemanya, dan dari gema itu ia tahu seberapa jauh mangsanya.",
      "Saat mendekati mangsa, kelelawar mengirim pulsa lebih sering tapi dengan suara yang lebih pelan. Di algoritma, laju pulsa r naik dan kenyaringan A turun.",
      "Satu kelelawar terbaik menjadi arah tujuan. Yang lain terbang menuju dia, lalu sesekali menjelajah di sekitarnya."
    ],
    "ba-karakter": [
      "Di Bat ada dua nilai yang berubah seiring waktu. Kenyaringan A turun dan laju pulsa r naik. Ada empat tombol pengatur, yaitu A nol, r nol, alpha A, dan gamma r. Saya geser slider-nya, dan perhatikan bentuk kurva serta lingkaran gema di sebelah kanan."
    ],
    "ba-cara": [
      "Pertama, setiap kelelawar terbang menuju yang terbaik. Frekuensi acak f menentukan seberapa jauh ia melangkah.",
      "Kedua, kadang kelelawar menjelajah dekat x bintang. Kalau angka acak lebih besar dari r, titik percobaan diganti titik acak di sekitar kelelawar terbaik.",
      "Ketiga, hanya yang lolos yang berpindah. Titik baru harus lebih baik dan lolos peluang yang ditentukan kenyaringan A. Kalau diterima, A turun dan r naik."
    ],
    "ba-sim": [
      "Kontrolnya sama dengan Firefly supaya mudah dibandingkan. Tanda centang menandai titik percobaan yang diterima dan tanda silang menandai yang ditolak. Perhatikan bagaimana kelelawar cenderung berkumpul ke satu titik terbaik."
    ],
    "model-fitness": [
      "Sekarang model matematikanya. Satu posisi kandidat hanyalah satu daftar angka, satu angka untuk tiap tugas.",
      "Angka itu dibulatkan ke bawah lalu ditambah satu, hasilnya nomor VM. Geser sedikit saja angkanya dan satu tugas bisa pindah mesin.",
      "Selanjutnya tiap VM menjumlahkan waktu kerja semua tugas yang diterimanya. Waktu satu tugas adalah panjang tugas dibagi kecepatan VM.",
      "Yang paling terlambat menentukan nilai. Makespan adalah waktu selesai VM yang paling lama bekerja, dan makespan kecil berarti jadwal bagus. Di program ini ditambahkan suku yang sangat kecil dari sebaran beban, hanya sebagai pemecah seri."
    ],
    "model-persamaan": [
      "Sekarang persamaannya terasa masuk akal karena kita sudah melihat gambarnya. Kita mulai dari jarak antar kunang-kunang, yang dinormalkan ke rentang nol sampai satu supaya nilai gamma bermakna sama di peta dua dimensi maupun di jadwal enam belas tugas.",
      "Daya tarik Firefly adalah beta nol dikali e pangkat minus gamma r kuadrat. Makin jauh makin lemah. Di Bat, frekuensi diambil acak di antara f minimum dan f maksimum.",
      "Aturan terbang Firefly menarik yang redup ke yang terang. Pada Bat, kecepatan diperbarui menuju x bintang. Perlu saya sampaikan dengan jujur, tanda kecepatan di sini dibalik dari tulisan Yang supaya kelelawar benar-benar menuju x bintang sesuai penjelasan verbalnya.",
      "Terakhir, Firefly menambahkan goyang acak alpha sebagai penjaga keragaman. Bat memakai seleksi, yaitu titik baru diterima hanya bila lebih baik dan lolos peluang A, lalu A turun dan r naik."
    ],
    "kasus-kode": [
      "Sekarang kita masukkan ke kasus cloud. Alurnya, tugas masuk, penjadwal membuat banyak kandidat jadwal, tiap kandidat dihitung makespan-nya, lalu Firefly atau Bat menggeser kandidat, dan jadwal terbaik dikirim ke VM. Saya klik sebuah blok tugas untuk memindahkannya ke VM berikutnya dan makespan ikut berubah. Lalu saya tekan Hasil Firefly atau Hasil Bat untuk melihat jadwal yang ditemukan algoritma pada beban kerja yang sama."
    ],
    "kasus-run": [
      "Di sini Firefly dan Bat menjadwalkan beban kerja yang sama persis, dengan populasi awal dan anggaran evaluasi yang sama. Jalur atas Firefly, jalur bawah Bat. Grafik di kanan membandingkan keduanya dengan Round-Robin, Min-Min, dan batas bawah ideal. Saya tekan Mulai, dan kita lihat blok-blok bergeser antar VM sementara makespan turun."
    ],
    adu: [
      "Sekarang adu langsung di peta dua dimensi. Posisi awal kedua algoritma sama persis, jadi perbedaannya hanya datang dari aturan geraknya. Saya bisa ganti fungsi uji ke Rastrigin, Ackley, atau Sphere, dan mengubah seed untuk menunjukkan bahwa pemenangnya bisa berganti. Satu kali jalan belum cukup untuk menarik kesimpulan, makanya slide berikutnya memakai banyak beban kerja."
    ],
    eksperimen: [
      "Di sini algoritma dijalankan pada sepuluh beban kerja berbeda, dan semuanya dihitung langsung di browser. Sumbu tegak adalah rasio terhadap batas bawah ideal, jadi satu kali berarti sempurna. Keduanya jauh lebih baik dari Round-Robin, tapi selisih Firefly dan Bat kecil dan berubah-ubah. Saya tekan Seed baru untuk menunjukkan hasilnya bisa bergeser. Karena itu saya tidak menyimpulkan satu algoritma selalu menang."
    ],
    ringkas: [
      "Untuk meringkas, Firefly dipandu semua yang lebih terang sehingga bisa membentuk beberapa kelompok, sedangkan Bat dipandu satu pemimpin, yaitu x bintang. Firefly membandingkan semua pasangan sehingga lebih mahal saat populasi besar, sementara Bat lebih ringan tapi punya lebih banyak parameter. Jumlah evaluasi fungsi tujuan sama. Baris terakhir adalah angka hidup dari sepuluh beban kerja."
    ],
    penutup: [
      "Ada tiga pesan penutup. Pertama, metaheuristik terbukti berguna karena hasilnya jauh di bawah Round-Robin. Kedua, antara Firefly dan Bat selisihnya kecil dan bergantung pada beban kerja, jadi jangan mengklaim satu pasti unggul. Ketiga, pilihan bergantung konteks, yaitu ukuran populasi, biaya evaluasi, dan waktu untuk menala parameter. Batasannya, tugas independen, VM tetap, tanpa antrean dan biaya komunikasi, dan sepuluh beban kerja belum merupakan uji statistik. Terima kasih."
    ],
    pustaka: [
      "Ini daftar sumber. Paper Firefly dari Yousif dan kawan-kawan tahun 2011 membahas penjadwalan job di grid, sedangkan paper Bat dari Raghavan dan kawan-kawan tahun 2015 membahas workflow di cloud. Perlu saya sampaikan dengan jujur bahwa untuk paper Bat hanya abstraknya yang saya verifikasi, dan angka di aplikasi ini adalah hasil simulator sendiri, bukan angka dari paper. Terima kasih, saya buka sesi diskusi."
    ]
  };

  // src/slides/index.js
  var base = [
    ...pembukaSlides,
    ...faSlides,
    ...baSlides,
    ...modelSlides,
    ...cloudSlides,
    ...hasilSlides,
    ...penutupSlides
  ];
  var slides = base.map((slide) => ({ ...slide, script: NASKAH[slide.id] ?? [] }));

  // src/main.js
  if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 0) {
      const rad = typeof r === "number" ? Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2) : 0;
      this.moveTo(x + rad, y);
      this.arcTo(x + w, y, x + w, y + h, rad);
      this.arcTo(x + w, y + h, x, y + h, rad);
      this.arcTo(x, y + h, x, y, rad);
      this.arcTo(x, y, x + w, y, rad);
      this.closePath();
      return this;
    };
  }
  function boot() {
    document.fonts?.load('600 32px "Sora"');
    document.fonts?.load('700 32px "Manrope"');
    document.fonts?.load('600 32px "Red Hat Mono"');
    const presenter = new Presenter(slides);
    presenter.start();
    window.__FA_BA_DECK__ = presenter;
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
