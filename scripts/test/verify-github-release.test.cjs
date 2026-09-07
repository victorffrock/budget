const test = require('node:test');
const assert = require('node:assert/strict');

const { findRelease } = require('../verify-github-release.cjs');

function makeRelease(overrides = {}) {
  return {
    id: 123,
    tag_name: 'v6.2.0-test.1',
    target_commitish: 'test',
    prerelease: true,
    draft: true,
    assets: [],
    ...overrides
  };
}

test('localiza e aceita um rascunho do canal test', () => {
  const release = makeRelease();
  assert.equal(findRelease([release], {
    tag: release.tag_name,
    channel: 'test',
    requireDraft: true
  }), release);
});

test('recusa branch, canal e estado incompatíveis', () => {
  assert.throws(
    () => findRelease([makeRelease({ target_commitish: 'main' })], {
      tag: 'v6.2.0-test.1', channel: 'test'
    }),
    /branch incorreta/
  );
  assert.throws(
    () => findRelease([makeRelease({ draft: false })], {
      tag: 'v6.2.0-test.1', channel: 'test', requireDraft: true
    }),
    /permanecer como rascunho/
  );
});

test('não confunde tags parecidas', () => {
  assert.throws(
    () => findRelease([makeRelease()], {
      tag: 'v6.2.0-test.10', channel: 'test'
    }),
    /não encontrada/
  );
});
