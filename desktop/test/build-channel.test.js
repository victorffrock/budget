const test = require('node:test');
const assert = require('node:assert/strict');
const { getBuildChannel, normalizeBuildChannel } = require('../build-channel.js');

test('usa stable como padrão seguro para canais ausentes ou inválidos', () => {
  assert.equal(normalizeBuildChannel(), 'stable');
  assert.equal(normalizeBuildChannel('preview'), 'stable');
  assert.equal(normalizeBuildChannel('stable'), 'stable');
});

test('reconhece somente o canal test explícito', () => {
  assert.equal(normalizeBuildChannel('test'), 'test');
  assert.equal(getBuildChannel({
    isPackaged: false,
    environment: { BUDGET_BUILD_CHANNEL: 'test' }
  }), 'test');
  assert.equal(getBuildChannel({
    isPackaged: true,
    environment: {},
    packageInfo: { budgetBuildChannel: 'test' }
  }), 'test');
});

test('uma versão empacotada não herda ambiente de desenvolvimento', () => {
  assert.equal(getBuildChannel({
    isPackaged: true,
    environment: { BUDGET_BUILD_CHANNEL: 'test' },
    packageInfo: {}
  }), 'stable');
});
