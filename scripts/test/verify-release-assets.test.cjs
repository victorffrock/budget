const assert = require('node:assert/strict');
const test = require('node:test');
const {
  getExpectedUpdaterAssets,
  validateReleaseAssets
} = require('../verify-release-assets.cjs');

test('o contrato estável inclui pares completos para instalações legadas', () => {
  const contract = { channel: 'stable', arch: 'x86_64', version: '6.1.7' };
  const assets = getExpectedUpdaterAssets(contract);

  assert.ok(assets.includes('Budget-6.1.3-x86_64.AppImage'));
  assert.ok(assets.includes('Budget-6.1.3-x86_64.AppImage.zsync'));
  assert.ok(assets.includes('Budget-6.1.4-x86_64.AppImage'));
  assert.ok(assets.includes('Budget-6.1.4-x86_64.AppImage.zsync'));
  assert.doesNotThrow(() => validateReleaseAssets(assets, contract));
});

test('o contrato falha se um zsync legado não tiver AppImage correspondente', () => {
  const contract = { channel: 'stable', arch: 'x86_64', version: '6.1.7' };
  const assets = getExpectedUpdaterAssets(contract)
    .filter((name) => name !== 'Budget-6.1.3-x86_64.AppImage');

  assert.throws(
    () => validateReleaseAssets(assets, contract),
    /Budget-6\.1\.3-x86_64\.AppImage/
  );
});

test('o contrato de testes usa somente a identidade separada do canal test', () => {
  const contract = { channel: 'test', arch: 'aarch64', version: '6.1.7-test.1' };
  const assets = getExpectedUpdaterAssets(contract);

  assert.deepEqual(assets, [
    'Budget-test-aarch64.AppImage',
    'Budget-test-aarch64.AppImage.zsync'
  ]);
  assert.doesNotThrow(() => validateReleaseAssets(assets, contract));
});
