// Menjalankan seluruh tes Node (tanpa dependensi). Pemakaian: npm test
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'tests');
const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join(dir, f));
const res = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit', cwd: root });
process.exit(res.status ?? 1);
