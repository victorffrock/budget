#!/usr/bin/env node
/*
 * Confirma que a versão estável contém o mesmo código distribuído na
 * pré-release. Somente os campos de versão e os HTMLs gerados podem mudar.
 */
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');

const VERSIONED_MANIFESTS = Object.freeze([
  'app/package.json',
  'app/package-lock.json',
  'desktop/package.json',
  'desktop/package-lock.json'
]);

const SOURCE_PATHS = Object.freeze([
  'app/src',
  'app/build.py',
  'desktop',
  ':(exclude)desktop/index.html',
  ':(exclude)desktop/package.json',
  ':(exclude)desktop/package-lock.json',
  'scripts/build-appimage.sh',
  'scripts/verify-test-appimage.sh',
  'icon.png',
  'manifest.webmanifest',
  'sw.js'
]);

function normalizeManifest(manifest) {
  const normalized = structuredClone(manifest);
  delete normalized.version;
  if (normalized.packages && normalized.packages['']) {
    delete normalized.packages[''].version;
  }
  return normalized;
}

function readJsonAtRef(ref, file) {
  const contents = execFileSync('git', ['show', `${ref}:${file}`], {
    encoding: 'utf8'
  });
  return JSON.parse(contents);
}

function verifyPromotedSource(testedRef, stableRef) {
  assert.ok(testedRef, 'informe a tag da pré-release');
  assert.ok(stableRef, 'informe a referência estável');

  const diff = spawnSync(
    'git',
    ['diff', '--quiet', testedRef, stableRef, '--', ...SOURCE_PATHS],
    { encoding: 'utf8' }
  );
  assert.equal(
    diff.status,
    0,
    `o código distribuído em ${stableRef} difere da pré-release ${testedRef}`
  );

  for (const file of VERSIONED_MANIFESTS) {
    assert.deepEqual(
      normalizeManifest(readJsonAtRef(testedRef, file)),
      normalizeManifest(readJsonAtRef(stableRef, file)),
      `${file} possui mudanças além da versão`
    );
  }
}

function main() {
  try {
    verifyPromotedSource(process.argv[2], process.argv[3]);
    console.log(`Código promovido corresponde à pré-release ${process.argv[2]}.`);
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { normalizeManifest, verifyPromotedSource };
