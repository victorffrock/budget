const test = require('node:test');
const assert = require('node:assert/strict');
const { extractFromText, parseBRLNumber } = require('../src/core.js');

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
