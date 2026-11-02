// Menghasilkan narasi-presentasi.md dari catatan presenter tiap slide. Pemakaian: npm run narasi
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { slides } = await import('../src/slides/index.js');

const toText = (html) =>
  html
    .replace(/<li>/g, '\n- ')
    .replace(/<\/(p|ul|ol)>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

let out = '# Narasi presentasi: Firefly vs Bat untuk Cloud Task Scheduling\n\nDihasilkan otomatis dari catatan presenter di tiap slide.\n';
slides.forEach((s, i) => {
  const script = (s.script || []).map((t, k) => (s.script.length > 1 ? `**Beat ${k + 1}.** ${t}` : t)).join('\n\n');
  out += `\n## ${i + 1}. ${s.title}\n\n### Naskah yang diucapkan\n\n${script}\n\n### Catatan teknis\n\n${toText(s.notes || '')}\n`;
});
fs.writeFileSync(path.join(root, 'narasi-presentasi.md'), out);
console.log(`narasi-presentasi.md ditulis (${slides.length} slide)`);
