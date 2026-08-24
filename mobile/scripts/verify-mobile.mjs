import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(scriptDir, '..');
const config = JSON.parse(readFileSync(resolve(mobileDir, 'capacitor.config.json'), 'utf8'));

if (config.appId !== 'br.com.victorferreirafranco.budget') {
  throw new Error('O application ID Android do Budget é inválido.');
}

for (const filename of ['index.html', 'icon.png', 'manifest.webmanifest', 'sw.js']) {
  if (!existsSync(resolve(mobileDir, 'www', filename))) {
    throw new Error(`Build Android incompleto: ${filename} não foi gerado.`);
  }
}

const html = readFileSync(resolve(mobileDir, 'www', 'index.html'), 'utf8');
if (!html.includes('<title>Budget</title>')) {
  throw new Error('O build Android não contém o título do Budget.');
}

const manifest = readFileSync(resolve(mobileDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
if (!manifest.includes('android:allowBackup="false"')) {
  throw new Error('O Android não pode incluir dados financeiros no backup automático.');
}
if (manifest.includes('android.permission.INTERNET')) {
  throw new Error('O Budget Android deve continuar sem permissão de internet.');
}

const gradle = readFileSync(resolve(mobileDir, 'android', 'app', 'build.gradle'), 'utf8');
if (!gradle.includes("BUDGET_ANDROID_KEYSTORE") || !gradle.includes("applicationIdSuffix '.test'")) {
  throw new Error('A configuração de assinatura ou isolamento do APK de teste está ausente.');
}

process.stdout.write('Empacotamento Android verificado.\n');
