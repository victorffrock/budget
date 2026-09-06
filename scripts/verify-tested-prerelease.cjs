#!/usr/bin/env node
/*
 * Impede que uma versão estável seja publicada antes de passar pelo canal
 * test. A entrada é a resposta JSON da API de releases do GitHub.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { validateReleaseAssets } = require('./verify-release-assets.cjs');

const TEST_ARCHITECTURES = Object.freeze(['x86_64', 'aarch64']);

function findTestedPrerelease(releases, stableVersion) {
  assert.match(
    stableVersion,
    /^\d+\.\d+\.\d+$/,
    'a versão estável deve usar o formato X.Y.Z'
  );
  assert.ok(Array.isArray(releases), 'a resposta de releases deve ser uma lista');

  const tagPrefix = `v${stableVersion}-test.`;
  const candidates = releases
    .map((release) => {
      const tagName = release.tag_name || '';
      const testNumber = tagName.startsWith(tagPrefix)
        ? tagName.slice(tagPrefix.length)
        : '';
      return { release, testNumber };
    })
    .filter(({ release, testNumber }) => (
      /^\d+$/.test(testNumber) &&
      release.prerelease === true &&
      release.draft === false
    ))
    .sort((left, right) => Number(right.testNumber) - Number(left.testNumber));

  assert.ok(
    candidates.length > 0,
    `publique primeiro uma pré-release v${stableVersion}-test.N`
  );

  const failures = [];
  for (const { release } of candidates) {
    try {
      assert.equal(
        release.target_commitish,
        'test',
        `${release.tag_name} deve apontar para a branch test`
      );
      const assetNames = (release.assets || []).map((asset) => asset.name || asset);
      for (const arch of TEST_ARCHITECTURES) {
        validateReleaseAssets(assetNames, {
          channel: 'test',
          arch,
          version: release.tag_name.slice(1)
        });
      }
      return release;
    } catch (error) {
      failures.push(`${release.tag_name}: ${error.message}`);
    }
  }

  assert.fail(
    `nenhuma pré-release de ${stableVersion} está completa: ${failures.join(' | ')}`
  );
}

function main() {
  const stableVersion = process.argv[2];
  const tagOnly = process.argv.includes('--tag-only');

  try {
    const releases = JSON.parse(fs.readFileSync(0, 'utf8'));
    const testedRelease = findTestedPrerelease(releases, stableVersion);
    console.log(
      tagOnly
        ? testedRelease.tag_name
        : `Pré-release validada antes da promoção: ${testedRelease.tag_name}.`
    );
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { findTestedPrerelease };
