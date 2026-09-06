const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeManifest } = require('../verify-promoted-source.cjs');

test('ignora somente os campos de versão dos manifestos', () => {
  const prerelease = normalizeManifest({
    name: 'budget',
    version: '6.2.0-test.1',
    dependencies: { electron: '43.0.0' },
    packages: {
      '': { version: '6.2.0-test.1', license: 'GPL-3.0-or-later' }
    }
  });
  const stable = normalizeManifest({
    name: 'budget',
    version: '6.2.0',
    dependencies: { electron: '43.0.0' },
    packages: {
      '': { version: '6.2.0', license: 'GPL-3.0-or-later' }
    }
  });

  assert.deepEqual(prerelease, stable);
});

test('preserva diferenças de dependências para que a promoção seja recusada', () => {
  const prerelease = normalizeManifest({
    version: '6.2.0-test.1',
    dependencies: { electron: '43.0.0' }
  });
  const stable = normalizeManifest({
    version: '6.2.0',
    dependencies: { electron: '44.0.0' }
  });

  assert.notDeepEqual(prerelease, stable);
});
