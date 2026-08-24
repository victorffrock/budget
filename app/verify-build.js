const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appDir = __dirname;
const bundled = fs.readFileSync(path.join(appDir, 'budget.html'), 'utf8');
const site = fs.readFileSync(path.join(appDir, '..', 'index.html'), 'utf8');
const desktop = fs.readFileSync(path.join(appDir, '..', 'desktop', 'index.html'), 'utf8');
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
  '<meta name="apple-mobile-web-app-title" content="Budget">',
  ''
].join('\n');

assert.ok(bundled.length > 6_000_000, 'o HTML offline deve conter pdf.js e o OCR incorporados');
assert.ok(!bundled.includes('__APP_VERSION__'), 'a versão deve ser incorporada no HTML gerado');
assert.ok(!bundled.includes('__TESSERACT_JS__'), 'o motor OCR deve ser incorporado no HTML gerado');
assert.ok(!bundled.includes('__APP_STATE_JS__'), 'o módulo de estado deve ser incorporado no HTML gerado');
assert.ok(!bundled.includes('__UI_LAYOUT_JS__'), 'o módulo de layout deve ser incorporado no HTML gerado');
assert.ok(!bundled.includes('__DIALOGS_JS__'), 'o módulo de diálogos deve ser incorporado no HTML gerado');
assert.ok(!bundled.includes('__THEME_JS__'), 'o módulo de aparência deve ser incorporado no HTML gerado');
assert.ok(bundled.includes('BUDGET_OCR_LANG_URL'), 'o modelo de português deve ser disponibilizado localmente ao OCR');
assert.ok(bundled.includes('var TesseractCore='), 'o núcleo OCR deve ser carregado pelo trabalhador local');
assert.ok(bundled.includes("cacheMethod: 'none'"), 'o OCR não deve gravar documentos no cache do navegador');
assert.ok(bundled.includes('BudgetState'), 'o módulo de estado deve estar disponível no aplicativo offline');
assert.ok(bundled.includes('BudgetUiLayout'), 'o módulo de layout deve estar disponível no aplicativo offline');
assert.ok(bundled.includes('BudgetDialogs'), 'o módulo de diálogos deve estar disponível no aplicativo offline');
assert.ok(bundled.includes('BudgetTheme'), 'o módulo de aparência deve estar disponível no aplicativo offline');
assert.ok(bundled.includes('Versão ' + appPackage.version), 'o diálogo Sobre deve exibir a versão do aplicativo');
assert.equal(appPackage.version, desktopPackage.version, 'as versões web e desktop devem ser iguais');
assert.ok(site.includes(pwaHead), 'a versão web deve conter os metadados da PWA');
assert.equal(
  site.replace('</title>\n' + pwaHead, '</title>'),
  bundled,
  'site e aplicativo devem usar a mesma interface gerada'
);
assert.equal(desktop, bundled, 'aplicativo desktop e versão offline devem usar a mesma interface gerada');

console.log('HTML gerado e versão PWA estão sincronizados.');
