#!/usr/bin/env node
/*
 * Confere o contrato de assets usado pelo GithubUpdater do Gear Lever.
 *
 * O atualizador encontra um .zsync pelo nome e procura o AppImage removendo
 * apenas o sufixo ".zsync". Por isso, cada .zsync publicado precisa ter um
 * AppImage de mesmo nome-base na mesma release. Esta verificação é executada
 * logo depois do upload e também possui testes unitários na CI comum.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');

const LEGACY_STABLE_VERSIONS = Object.freeze(['6.1.3', '6.1.4']);
const SUPPORTED_ARCHITECTURES = Object.freeze(['x86_64', 'aarch64']);

function getOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function assertContractInput({ channel, arch, version }) {
  assert.ok(['stable', 'test'].includes(channel), 'canal inválido');
  assert.ok(SUPPORTED_ARCHITECTURES.includes(arch), 'arquitetura inválida');
  assert.match(version, /^\d+\.\d+\.\d+(?:-test\.\d+)?$/, 'versão inválida');
}

function getExpectedUpdaterAssets({ channel, arch, version }) {
  assertContractInput({ channel, arch, version });

  if (channel === 'test') {
    return [`Budget-test-${arch}.AppImage`, `Budget-test-${arch}.AppImage.zsync`];
  }

  const versioned = `Budget-${version}-${arch}.AppImage`;
  const canonical = `Budget-${arch}.AppImage`;
  const legacy = LEGACY_STABLE_VERSIONS.flatMap((legacyVersion) => {
    const file = `Budget-${legacyVersion}-${arch}.AppImage`;
    return [file, `${file}.zsync`];
  });

  return [
    versioned,
    `${versioned}.zsync`,
    canonical,
    `${canonical}.zsync`,
    ...legacy
  ];
}

function validateReleaseAssets(assetNames, contract) {
  const assets = new Set(assetNames.filter(Boolean));
  const expected = getExpectedUpdaterAssets(contract);
  const missing = expected.filter((name) => !assets.has(name));

  assert.deepEqual(
    missing,
    [],
    `assets obrigatórios ausentes: ${missing.join(', ')}`
  );

  // As arquiteturas são enviadas por jobs paralelos. Durante alguns segundos,
  // a API pode mostrar um arquivo da outra arquitetura antes do respectivo
  // par terminar de subir. Cada job valida somente a arquitetura pela qual é
  // responsável; o outro job faz a verificação complementar.
  const architectureMarker = `-${contract.arch}.AppImage`;
  for (const asset of assets) {
    if (!asset.includes(architectureMarker)) continue;
    if (!asset.endsWith('.zsync')) continue;
    const appImage = asset.slice(0, -'.zsync'.length);
    assert.ok(
      assets.has(appImage),
      `o arquivo ${asset} não possui o AppImage correspondente ${appImage}`
    );
  }

  return expected;
}

function readAssetNamesFromStdin() {
  return fs.readFileSync(0, 'utf8')
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const contract = {
    channel: getOption(args, '--channel'),
    arch: getOption(args, '--arch'),
    version: getOption(args, '--version')
  };

  try {
    const expected = validateReleaseAssets(readAssetNamesFromStdin(), contract);
    console.log(`Contrato de atualização validado: ${expected.join(', ')}.`);
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  LEGACY_STABLE_VERSIONS,
  getExpectedUpdaterAssets,
  validateReleaseAssets
};
