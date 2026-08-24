import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAndroidVersion } from './version.mjs';

const buildType = process.argv[2];
if (!['debug', 'release'].includes(buildType)) {
  throw new Error('Uso: node scripts/gradle-build.mjs <debug|release>');
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(scriptDir, '..');
const androidDir = resolve(mobileDir, 'android');
const version = resolveAndroidVersion();
const gradleArgs = [
  '--no-daemon',
  `assemble${buildType[0].toUpperCase()}${buildType.slice(1)}`,
  `-PBUDGET_VERSION_NAME=${version.versionName}`,
  `-PBUDGET_VERSION_CODE=${version.versionCode}`
];

// A chave de release é lida exclusivamente de variáveis de ambiente. Ela não
// passa pelo JavaScript, pelos logs nem pelo controle de versão.
execFileSync('./gradlew', gradleArgs, { cwd: androidDir, stdio: 'inherit' });
