import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(scriptDir, '..');
const projectDir = resolve(mobileDir, '..');
const appDir = resolve(projectDir, 'app');
const webDir = resolve(mobileDir, 'www');
const webFiles = ['index.html', 'icon.png', 'manifest.webmanifest', 'sw.js'];

// A fonte da interface continua sendo única: o mesmo build abastece web,
// Electron e Android. Assim não surgem versões divergentes do Budget.
const build = spawnSync('python3', ['build.py'], {
  cwd: appDir,
  encoding: 'utf8'
});

if (build.status !== 0) {
  process.stderr.write(build.stderr || build.stdout || 'Falha ao gerar a interface web.\n');
  process.exit(build.status || 1);
}

rmSync(webDir, { recursive: true, force: true });
mkdirSync(webDir, { recursive: true });

for (const filename of webFiles) {
  const source = resolve(projectDir, filename);
  if (!existsSync(source)) throw new Error(`Arquivo web ausente: ${filename}`);
  cpSync(source, resolve(webDir, filename));
}

process.stdout.write(`Web Android preparado em ${webDir}\n`);
