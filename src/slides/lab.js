/**
 * "Lab mini": kanvas lebar di tengah, baris slider (fader) di bawahnya.
 * Setiap gerakan slider langsung terbaca oleh fungsi gambar lewat objek params.
 */

import { startCanvasLoop } from '../render/motion.js';
import { ICONS } from './console.js';

export const LAB_W = 1720;
export const LAB_H = 620;

/**
 * @param {HTMLElement} root
 * @param {{reducedMotion:boolean, registerHooks:Function}} ctx
 * @param {{tag:string,title:string,intro:string,color:string,
 *   sliders:Array<{key:string,label:string,min:number,max:number,step:number,value:number,desc:string}>,
 *   draw:(ctx:CanvasRenderingContext2D, frame:object, params:object, pointer:object)=>void}} spec
 */
export function mountLab(root, { reducedMotion, registerHooks }, spec) {
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
        ${spec.sliders
          .map(
            (s) => `
          <label class="fader" for="lab-${s.key}">
            <span class="knob-top">${s.label}<b id="lab-v-${s.key}">${s.value}</b></span>
            <input type="range" id="lab-${s.key}" data-key="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" />
            <span class="fader-note">${s.desc}</span>
          </label>`
          )
          .join('')}
        <button type="button" class="fader-reset" id="lab-reset" title="Kembalikan nilai bawaan (R)">${ICONS.reset}<span>Bawaan</span></button>
      </div>
    </div>`;

  const canvas = root.querySelector('#lab-canvas');
  const inputs = [...root.querySelectorAll('input[type=range]')];
  const show = (key) => (root.querySelector(`#lab-v-${key}`).textContent = params[key]);

  inputs.forEach((input) =>
    input.addEventListener('input', () => {
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
  root.querySelector('#lab-reset').addEventListener('click', reset);
  registerHooks?.({ reset });

  canvas.addEventListener('pointermove', (e) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - box.left) / box.width) * LAB_W;
    pointer.y = ((e.clientY - box.top) / box.height) * LAB_H;
    pointer.active = true;
  });
  canvas.addEventListener('pointerleave', () => (pointer.active = false));

  const loop = startCanvasLoop(canvas, (c, frame) => spec.draw(c, frame, params, pointer), {
    calm: reducedMotion,
    width: LAB_W,
    height: LAB_H
  });
  return () => loop.stop();
}
