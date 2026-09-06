const test = require('node:test');
const assert = require('node:assert/strict');

const {
  assertVersionTransition,
  compareCore,
  parseVersion
} = require('../verify-test-candidate.cjs');

test('classifica versões estáveis e de teste sem aceitar formatos ambíguos', () => {
  assert.deepEqual(parseVersion('6.2.0'), {
    channel: 'stable',
    core: [6, 2, 0],
    testNumber: null
  });
  assert.deepEqual(parseVersion('6.2.0-test.3'), {
    channel: 'test',
    core: [6, 2, 0],
    testNumber: 3
  });
  assert.throws(() => parseVersion('6.2.0-beta.1'), /não segue/);
});

test('compara cada parte numérica da versão', () => {
  assert.ok(compareCore([6, 2, 0], [6, 1, 9]) > 0);
  assert.equal(compareCore([6, 2, 0], [6, 2, 0]), 0);
  assert.ok(compareCore([6, 1, 9], [6, 2, 0]) < 0);
});

test('exige uma versão inédita quando arquivos distribuídos mudam', () => {
  assert.throws(
    () => assertVersionTransition('6.1.8', '6.1.8'),
    /sem incrementar a versão/
  );
});

test('inicia um ciclo de testes apenas com uma versão futura', () => {
  assert.equal(
    assertVersionTransition('6.1.8', '6.1.9-test.1'),
    'test'
  );
  assert.throws(
    () => assertVersionTransition('6.1.8', '6.1.8-test.1'),
    /nova pré-release da mesma versão/
  );
});

test('incrementa test.N sem reutilizar ou regredir a versão', () => {
  assert.equal(
    assertVersionTransition('6.1.9-test.1', '6.1.9-test.2'),
    'test'
  );
  assert.throws(
    () => assertVersionTransition('6.1.9-test.2', '6.1.9-test.1'),
    /número test.N precisa aumentar/
  );
});

test('uma versão estável só deriva da pré-release do mesmo ciclo', () => {
  assert.equal(
    assertVersionTransition('6.1.9-test.2', '6.1.9'),
    'stable'
  );
  assert.throws(
    () => assertVersionTransition('6.1.8', '6.1.9'),
    /só pode ser preparada/
  );
  assert.throws(
    () => assertVersionTransition('6.1.9-test.2', '6.2.0'),
    /deve manter X.Y.Z/
  );
});
