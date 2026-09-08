const assert = require('node:assert/strict');
const test = require('node:test');
const {
  getExpectedReleaseAssets,
  getExpectedUpdaterAssets,
  validateReleaseAssets
} = require('../verify-release-assets.cjs');

test('o contrato estável usa somente o par canônico da arquitetura', () => {
  const contract = { channel: 'stable', arch: 'x86_64' };
  const assets = getExpectedUpdaterAssets(contract);

  assert.deepEqual(assets, [
    'Budget-x86_64.AppImage',
    'Budget-x86_64.AppImage.zsync'
  ]);
  assert.doesNotThrow(() => validateReleaseAssets(
    getExpectedReleaseAssets(contract),
    contract
  ));
});

test('o contrato estável rejeita aliases legados e arquivos versionados', () => {
  const contract = { channel: 'stable', arch: 'x86_64' };
  const assets = [
    ...getExpectedReleaseAssets(contract),
    'Budget-6.1.3-x86_64.AppImage',
    'Budget-6.1.3-x86_64.AppImage.zsync',
    'Budget-6.1.10-x86_64.AppImage',
    'Budget-6.1.10-x86_64.AppImage.zsync'
  ];

  assert.throws(
    () => validateReleaseAssets(assets, contract),
    /assets de atualização inesperados/
  );
});

test('o contrato estável exige o AppImage correspondente ao zsync', () => {
  const contract = { channel: 'stable', arch: 'aarch64' };
  const assets = getExpectedReleaseAssets(contract)
    .filter((name) => name !== 'Budget-aarch64.AppImage');

  assert.throws(
    () => validateReleaseAssets(assets, contract),
    /Budget-aarch64\.AppImage/
  );
});

test('o contrato exige checksums e os dois SBOMs da arquitetura', () => {
  const contract = { channel: 'stable', arch: 'x86_64' };
  const assets = getExpectedReleaseAssets(contract)
    .filter((name) => name !== 'SHA256SUMS-x86_64.txt');

  assert.throws(
    () => validateReleaseAssets(assets, contract),
    /SHA256SUMS-x86_64\.txt/
  );
});

test('o contrato de testes usa somente a identidade separada do canal test', () => {
  const contract = { channel: 'test', arch: 'aarch64' };
  const assets = getExpectedUpdaterAssets(contract);

  assert.deepEqual(assets, [
    'Budget-test-aarch64.AppImage',
    'Budget-test-aarch64.AppImage.zsync'
  ]);
  assert.doesNotThrow(() => validateReleaseAssets(
    getExpectedReleaseAssets(contract),
    contract
  ));
});

test('ignora upload parcial da outra arquitetura durante jobs paralelos', () => {
  const x86Assets = [
    ...getExpectedReleaseAssets({ channel: 'test', arch: 'x86_64' }),
    // O arquivo ARM pode aparecer sozinho enquanto seu job ainda envia o par.
    'Budget-test-aarch64.AppImage.zsync'
  ];

  assert.doesNotThrow(() => validateReleaseAssets(x86Assets, {
    channel: 'test',
    arch: 'x86_64'
  }));
});

test('o contrato de testes rejeita a identidade do canal estável', () => {
  const contract = { channel: 'test', arch: 'x86_64' };
  const assets = [
    ...getExpectedReleaseAssets(contract),
    'Budget-x86_64.AppImage',
    'Budget-x86_64.AppImage.zsync'
  ];

  assert.throws(
    () => validateReleaseAssets(assets, contract),
    /assets de atualização inesperados/
  );
});
