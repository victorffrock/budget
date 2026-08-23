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
