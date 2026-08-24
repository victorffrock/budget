import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packagePath = resolve(scriptDir, '..', '..', 'app', 'package.json');
export function resolveAndroidVersion(input) {
  const sourceVersion = input || JSON.parse(readFileSync(packagePath, 'utf8')).version;
  const match = String(sourceVersion).match(/^v?(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/);

  if (!match) throw new Error(`Versão Android inválida: ${sourceVersion}`);

  const [, majorText, minorText, patchText] = match;
  const major = Number(majorText);
  const minor = Number(minorText);
  const patch = Number(patchText);
  const prerelease = String(sourceVersion).includes('-');
  const prereleaseNumber = Number((String(sourceVersion).match(/\.(\d+)$/) || [])[1] || 1);

  if (major > 2000 || minor > 999 || patch > 99 || prereleaseNumber > 98) {
    throw new Error(`Versão Android fora da faixa suportada: ${sourceVersion}`);
  }

  // Cada trio SemVer reserva 100 códigos: 1–98 para pré-releases e 99 para a
  // estável. Isso mantém a ordem exigida pelo Android sem depender do contador
  // de execuções do GitHub Actions.
  const base = major * 1_000_000 + minor * 10_000 + patch * 100;
  return {
    versionName: String(sourceVersion).replace(/^v/, ''),
    versionCode: base + (prerelease ? prereleaseNumber : 99)
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = resolveAndroidVersion(process.argv[2]);
  process.stdout.write(`version_name=${version.versionName}\nversion_code=${version.versionCode}\n`);
}
