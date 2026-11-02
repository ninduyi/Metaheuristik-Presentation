import { pembukaSlides } from './pembukaSlides.js';
import { faSlides } from './faSlides.js';
import { baSlides } from './baSlides.js';
import { modelSlides } from './modelSlides.js';
import { cloudSlides } from './cloudSlides.js';
import { hasilSlides } from './hasilSlides.js';
import { penutupSlides } from './penutupSlides.js';
import { NASKAH } from './naskah.js';

const base = [
  ...pembukaSlides,
  ...faSlides,
  ...baSlides,
  ...modelSlides,
  ...cloudSlides,
  ...hasilSlides,
  ...penutupSlides
];

/** Menempelkan naskah narasi ke tiap slide berdasarkan id. */
export const slides = base.map((slide) => ({ ...slide, script: NASKAH[slide.id] ?? [] }));
