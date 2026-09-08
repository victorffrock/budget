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

const SUPPORTED_ARCHITECTURES = Object.freeze(['x86_64', 'aarch64']);

function getOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function assertContractInput({ channel, arch }) {
  assert.ok(['stable', 'test'].includes(channel), 'canal inválido');
  assert.ok(SUPPORTED_ARCHITECTURES.includes(arch), 'arquitetura inválida');
}

function getExpectedUpdaterAssets({ channel, arch }) {
  assertContractInput({ channel, arch });

  if (channel === 'test') {
    return [`Budget-test-${arch}.AppImage`, `Budget-test-${arch}.AppImage.zsync`];
  }

  const canonical = `Budget-${arch}.AppImage`;
  return [canonical, `${canonical}.zsync`];
}

function getExpectedReleaseAssets(contract) {
  const { arch } = contract;
  return [
    ...getExpectedUpdaterAssets(contract),
    `SBOM-app-${arch}.cdx.json`,
    `SBOM-desktop-${arch}.cdx.json`,
    `SHA256SUMS-${arch}.txt`
  ];
}

function validateReleaseAssets(assetNames, contract) {
  const assets = new Set(assetNames.filter(Boolean));
  const expectedUpdater = getExpectedUpdaterAssets(contract);
  const expected = getExpectedReleaseAssets(contract);
  const missing = expected.filter((name) => !assets.has(name));

  assert.deepEqual(
    missing,
    [],
    `assets obrigatórios ausentes: ${missing.join(', ')}`
  );

  // Uma release deve expor exatamente uma identidade de atualização por
  // arquitetura. Nomes versionados ou aliases voltariam a poluir a página e
  // poderiam criar fontes divergentes no Gear Lever.
  const architectureSuffixes = [
    `-${contract.arch}.AppImage`,
    `-${contract.arch}.AppImage.zsync`
  ];
  const unexpected = [...assets].filter((name) => (
    name.startsWith('Budget-') &&
    architectureSuffixes.some((suffix) => name.endsWith(suffix)) &&
    !expectedUpdater.includes(name)
  ));

  assert.deepEqual(
    unexpected,
    [],
    `assets de atualização inesperados: ${unexpected.join(', ')}`
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
    arch: getOption(args, '--arch')
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
  getExpectedReleaseAssets,
  getExpectedUpdaterAssets,
  validateReleaseAssets
};
