const test = require('node:test');
const assert = require('node:assert/strict');
const { getBuildChannel, getBuildIdentity, normalizeBuildChannel } = require('../build-channel.js');

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

test('mantém identidades de desktop separadas entre estável e teste', () => {
  assert.deepEqual(getBuildIdentity('stable'), {
    appId: 'br.com.victorferreirafranco.budget',
    desktopName: 'br.com.victorferreirafranco.budget',
    iconFile: 'icon.png',
    productName: 'Budget',
    executableName: 'budget'
  });
  assert.deepEqual(getBuildIdentity('test'), {
    appId: 'br.com.victorferreirafranco.budget.test',
    desktopName: 'br.com.victorferreirafranco.budget.test',
    iconFile: 'icon-test.png',
    productName: 'Budget Test',
    executableName: 'budget-test'
  });
});
