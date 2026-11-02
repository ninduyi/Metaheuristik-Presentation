import { Presenter } from './ui/presenter.js';
import { slides } from './slides/index.js';

// Peramban lama belum punya roundRect pada kanvas; sediakan versi sederhana.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 0) {
    const rad = typeof r === 'number' ? Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2) : 0;
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
  // Kanvas hanya bisa memakai font yang sudah termuat, jadi minta lebih awal supaya label tidak berganti rupa
  document.fonts?.load('600 32px "Sora"');
  document.fonts?.load('700 32px "Manrope"');
  document.fonts?.load('600 32px "Red Hat Mono"');

  const presenter = new Presenter(slides);
  presenter.start();
  window.__FA_BA_DECK__ = presenter;
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
