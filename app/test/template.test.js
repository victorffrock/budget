const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const template = fs.readFileSync(path.join(__dirname, '..', 'src', 'template.html'), 'utf8');

test('oferece menu e diálogos acessíveis seguindo a experiência GNOME', () => {
  assert.match(template, /aria-haspopup="menu"/);
  assert.match(template, /role="menu"/);
  assert.match(template, /role="dialog" aria-modal="true"/);
  assert.match(template, /Sobre o Somador de Contas/);
  assert.match(template, /Gear Lever/);
});

test('mantém o foco acessível no menu e nos diálogos', () => {
  assert.doesNotMatch(template, /^\s*app-region\s*:/m);
  assert.match(template, /-webkit-app-region: drag/);
  assert.match(template, /function keepFocusInsideDialog/);
  assert.match(template, /event\.key === 'ArrowDown'/);
  assert.match(template, /setMenuOpen\(false, true\)/);
});

test('mantém a barra de título visível enquanto o conteúdo do app rola', () => {
  assert.match(template, /\.headerbar\{[\s\S]*?position:sticky;[\s\S]*?top:0;[\s\S]*?z-index:30;/);
  assert.match(template, /body\.is-desktop\{[\s\S]*?overflow:hidden;/);
  assert.match(template, /\.app-window\{[\s\S]*?height:100vh;[\s\S]*?overflow:hidden;/);
  assert.match(template, /\.content\{[\s\S]*?min-height:0;[\s\S]*?overflow-y:auto;/);
});

test('mantém uma versão explícita para o diálogo Sobre', () => {
  assert.match(template, /Versão __APP_VERSION__/);
  assert.match(template, /Victor Ferreira Franco/);
});

test('oferece OCR local como alternativa para PDFs escaneados', () => {
  assert.match(template, /__TESSERACT_JS__/);
  assert.match(template, /__TESSERACT_WORKER_JSON__/);
  assert.match(template, /Leitura por OCR/);
  assert.match(template, /Cancelar leitura/);
  assert.match(template, /var MAX_OCR_PAGES = 4;/);
  assert.match(template, /var MAX_OCR_FILE_BYTES = 25 \* 1024 \* 1024;/);
});

test('permite somar valores avulsos com uma descrição opcional', () => {
  assert.match(template, /id="manualValueDialog"/);
  assert.match(template, /id="addManualEmptyBtn"/);
  assert.doesNotMatch(template, /id="addManualBtn"/);
  assert.match(template, /Adicionar valor avulso/);
  assert.match(template, /id="manualValueDescription"/);
  assert.match(template, /id="manualValueInput"/);
  assert.match(template, /kind: 'manual'/);
  assert.match(template, /Valor avulso adicionado ao total/);
  assert.match(template, /action === 'add-manual'/);
});

test('calcula e comunica o saldo depois de pagar as contas', () => {
  assert.match(template, /id="balanceCard" aria-label="Dinheiro disponível e saldo final">/);
  assert.doesNotMatch(template, /id="balanceCard"[^>]*\bhidden\b/);
  assert.match(template, /id="availableAmountInput"/);
  assert.match(template, /function renderBalance/);
  assert.doesNotMatch(template, /balanceCard\.hidden/);
  assert.match(template, /Adicione contas para calcular o saldo final/);
  assert.match(template, /Sobra após pagar as contas/);
  assert.match(template, /O saldo ficará zerado/);
  assert.match(template, /Faltará após pagar as contas/);
});
