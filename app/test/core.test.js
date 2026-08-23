const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  calculateRemainingBalance,
  extractFromOcrText,
  extractFromText,
  parseBRLNumber,
  shouldUseOcr
} = require('../src/core.js');

function readOcrFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', 'ocr', name), 'utf8');
}

test('aceita valores brasileiros bem formatados', () => {
  assert.equal(parseBRLNumber('R$ 1.234,56'), 1234.56);
  assert.equal(parseBRLNumber('1234,5'), 1234.5);
  assert.equal(parseBRLNumber('0'), 0);
});

test('rejeita entrada manual ambígua ou inválida', () => {
  for (const value of ['', 'abc123', '-10', '1,2,3', '1.234,56x', '12.34']) {
    assert.equal(parseBRLNumber(value), null, value);
  }
});

test('calcula o saldo restante com valores positivo, zero e negativo', () => {
  assert.equal(calculateRemainingBalance(2000, 1624.65), 375.35);
  assert.equal(calculateRemainingBalance(1624.65, 1624.65), 0);
  assert.equal(calculateRemainingBalance(1000, 1624.65), -624.65);
  assert.equal(calculateRemainingBalance(-1, 10), null);
});

test('extrai um valor com rótulo de alta confiança', () => {
  assert.deepEqual(
    extractFromText('Vencimento: 12/09/2026\nValor a pagar R$ 1.234,56'),
    { amount: 1234.56, confidence: 'ok', due: '12/09/2026' }
  );
});

test('não escolhe um valor quando rótulos igualmente confiáveis divergem', () => {
  const result = extractFromText('Valor a pagar 100,00. Valor a pagar 200,00.');
  assert.equal(result.amount, null);
  assert.equal(result.confidence, 'err');
});

test('usa OCR apenas quando a leitura textual não identificou um valor', () => {
  assert.equal(shouldUseOcr({ amount: null }), true);
  assert.equal(shouldUseOcr({ amount: 42.50 }), false);
});

test('resultados do OCR sempre pedem conferência', () => {
  assert.deepEqual(
    extractFromOcrText('Vencimento 12/09/2026\nValor a pagar R$ 987,65'),
    { amount: 987.65, confidence: 'warn', due: '12/09/2026' }
  );
});

test('reconhece uma saída de OCR com ruído no rótulo e preserva a data', () => {
  assert.deepEqual(
    extractFromOcrText(readOcrFixture('valor-com-ruido.txt')),
    { amount: 1234.56, confidence: 'warn', due: '05/10/2026' }
  );
});

test('não escolhe um valor de OCR quando rótulos equivalentes divergem', () => {
  assert.deepEqual(
    extractFromOcrText(readOcrFixture('valores-ambiguos.txt')),
    { amount: null, confidence: 'err', due: '05/10/2026' }
  );
});
