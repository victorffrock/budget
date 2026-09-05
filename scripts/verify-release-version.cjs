#!/usr/bin/env node
/*
 * Mantém a versão exibida pela PWA, pelo Electron e pela tag de uma release
 * alinhadas. A tag é opcional para que o mesmo verificador possa rodar no CI
 * comum; em uma release, passe a tag como primeiro argumento.
 */
const assert = require('node:assert/strict');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');
const appPackage = require(path.join(rootDir, 'app', 'package.json'));
const desktopPackage = require(path.join(rootDir, 'desktop', 'package.json'));
const releaseTag = process.argv[2];
const releaseChannel = process.argv[3];

assert.equal(
  appPackage.version,
  desktopPackage.version,
  'as versões dos pacotes web e desktop devem ser iguais'
);

if (releaseTag) {
  assert.equal(
    releaseTag,
    `v${appPackage.version}`,
    'a tag da release deve corresponder à versão dos pacotes'
  );
}

if (releaseChannel) {
  assert.ok(
    ['stable', 'test'].includes(releaseChannel),
    'o canal de release deve ser stable ou test'
  );

  const versionPattern = releaseChannel === 'test'
    ? /^\d+\.\d+\.\d+-test\.\d+$/
    : /^\d+\.\d+\.\d+$/;

  assert.match(
    appPackage.version,
    versionPattern,
    `a versão ${appPackage.version} não corresponde ao canal ${releaseChannel}`
  );
}

console.log(
  `Versões sincronizadas: ${appPackage.version}` +
  `${releaseTag ? ` (${releaseTag})` : ''}` +
  `${releaseChannel ? ` [${releaseChannel}]` : ''}.`
);
