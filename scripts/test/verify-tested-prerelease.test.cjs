const test = require('node:test');
const assert = require('node:assert/strict');

const { findTestedPrerelease } = require('../verify-tested-prerelease.cjs');

function makeRelease(overrides = {}) {
  return {
    tag_name: 'v6.2.0-test.1',
    target_commitish: 'test',
    prerelease: true,
    draft: false,
    assets: [
      { name: 'Budget-test-x86_64.AppImage' },
      { name: 'Budget-test-x86_64.AppImage.zsync' },
      { name: 'Budget-test-aarch64.AppImage' },
      { name: 'Budget-test-aarch64.AppImage.zsync' }
    ],
    ...overrides
  };
}

test('aceita uma pré-release completa da mesma versão estável', () => {
  const release = makeRelease();
  assert.equal(findTestedPrerelease([release], '6.2.0'), release);
});

test('recusa promoção sem pré-release da mesma versão', () => {
  assert.throws(
    () => findTestedPrerelease([makeRelease()], '6.2.1'),
    /publique primeiro uma pré-release v6\.2\.1-test\.N/
  );
});

test('recusa pré-release criada fora da branch test', () => {
  assert.throws(
    () => findTestedPrerelease([
      makeRelease({ target_commitish: 'main' })
    ], '6.2.0'),
    /deve apontar para a branch test/
  );
});

test('recusa pré-release sem o par de atualização ARM', () => {
  const release = makeRelease({
    assets: [
      { name: 'Budget-test-x86_64.AppImage' },
      { name: 'Budget-test-x86_64.AppImage.zsync' },
      { name: 'Budget-test-aarch64.AppImage' }
    ]
  });

  assert.throws(
    () => findTestedPrerelease([release], '6.2.0'),
    /Budget-test-aarch64\.AppImage\.zsync/
  );
});
