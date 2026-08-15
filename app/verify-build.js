const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appDir = __dirname;
const bundled = fs.readFileSync(path.join(appDir, 'somador-de-contas.html'), 'utf8');
const site = fs.readFileSync(path.join(appDir, '..', 'index.html'), 'utf8');
const appPackage = require(path.join(appDir, 'package.json'));
const desktopPackage = require(path.join(appDir, '..', 'desktop', 'package.json'));
const pwaHead = [
  '<link rel="icon" href="icon.png" type="image/png">',
  '<link rel="apple-touch-icon" href="icon.png">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<meta name="theme-color" content="#f6f5f4">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="apple-mobile-web-app-title" content="Somador de Contas">',
  ''
].join('\n');

assert.ok(bundled.length > 1_000_000, 'o HTML offline deve conter o pdf.js incorporado');
assert.ok(!bundled.includes('__APP_VERSION__'), 'a versão deve ser incorporada no HTML gerado');
assert.ok(bundled.includes('Versão ' + appPackage.version), 'o diálogo Sobre deve exibir a versão do aplicativo');
assert.equal(appPackage.version, desktopPackage.version, 'as versões web e desktop devem ser iguais');
assert.ok(site.includes(pwaHead), 'a versão web deve conter os metadados da PWA');
assert.equal(
  site.replace('</title>\n' + pwaHead, '</title>'),
  bundled,
  'site e aplicativo devem usar a mesma interface gerada'
);

console.log('HTML gerado e versão PWA estão sincronizados.');
