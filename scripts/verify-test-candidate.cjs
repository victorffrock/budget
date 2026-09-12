#!/usr/bin/env node
/*
 * Classifica uma alteração integrada em test como documentação, pré-release
 * ou preparação estável. Mudanças capazes de afetar o AppImage, a aplicação
 * ou sua atualização precisam sempre avançar para uma versão inédita.
 */
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');

const RELEASE_RELEVANT_PATHS = Object.freeze([
  '.github/workflows',
  'app',
  'desktop',
  'scripts',
  'icon.png',
  'manifest.webmanifest',
  'sw.js'
]);

const STABLE_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
const TEST_VERSION = /^(\d+)\.(\d+)\.(\d+)-test\.(\d+)$/;

function parseVersion(version) {
  let match = version.match(TEST_VERSION);
  if (match) {
    return {
      channel: 'test',
      core: match.slice(1, 4).map(Number),
      testNumber: Number(match[4])
    };
  }

  match = version.match(STABLE_VERSION);
  if (match) {
    return {
      channel: 'stable',
      core: match.slice(1, 4).map(Number),
      testNumber: null
    };
  }

  assert.fail(`a versão ${version} não segue X.Y.Z ou X.Y.Z-test.N`);
}

function compareCore(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function assertVersionTransition(baseVersion, currentVersion) {
  assert.notEqual(
    currentVersion,
    baseVersion,
    'arquivos distribuídos mudaram sem incrementar a versão; prepare uma ' +
      'candidata inédita X.Y.Z-test.N antes de integrar (inclusive para ' +
      'atualizações do Dependabot)'
  );

  const base = parseVersion(baseVersion);
  const current = parseVersion(currentVersion);
  const coreOrder = compareCore(current.core, base.core);

  if (current.channel === 'stable') {
    assert.equal(
      base.channel,
      'test',
      'uma versão estável só pode ser preparada a partir de uma pré-release em test'
    );
    assert.equal(
      coreOrder,
      0,
      'a versão estável deve manter X.Y.Z da pré-release aprovada'
    );
    return 'stable';
  }

  if (coreOrder > 0) return 'test';

  assert.equal(
    coreOrder,
    0,
    'uma pré-release não pode reduzir nem reutilizar uma versão anterior'
  );
  assert.equal(
    base.channel,
    'test',
    'uma nova pré-release da mesma versão exige uma pré-release anterior'
  );
  assert.ok(
    current.testNumber > base.testNumber,
    'o número test.N precisa aumentar'
  );
  return 'test';
}

function readVersionsAtRef(ref) {
  const readPackage = (file) => JSON.parse(execFileSync(
    'git',
    ['show', `${ref}:${file}`],
    { encoding: 'utf8' }
  ));
  const appVersion = readPackage('app/package.json').version;
  const desktopVersion = readPackage('desktop/package.json').version;
  assert.equal(
    appVersion,
    desktopVersion,
    `as versões web e desktop em ${ref} precisam ser iguais`
  );
  return appVersion;
}

function hasRelevantChanges(baseRef, headRef) {
  const diff = spawnSync(
    'git',
    ['diff', '--quiet', baseRef, headRef, '--', ...RELEASE_RELEVANT_PATHS],
    { encoding: 'utf8' }
  );
  assert.ok(
    diff.status === 0 || diff.status === 1,
    diff.stderr || `não foi possível comparar ${baseRef} e ${headRef}`
  );
  return diff.status === 1;
}

function getOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function classifyCandidate({ baseRef, headRef, mode }) {
  assert.ok(baseRef, 'informe --base');
  assert.ok(headRef, 'informe --head');
  assert.ok(
    ['pull-request', 'push'].includes(mode),
    '--mode deve ser pull-request ou push'
  );

  if (!hasRelevantChanges(baseRef, headRef)) return 'skip';

  const baseVersion = readVersionsAtRef(baseRef);
  const currentVersion = readVersionsAtRef(headRef);
  const channel = assertVersionTransition(baseVersion, currentVersion);

  if (channel === 'test') {
    const tag = `v${currentVersion}`;
    const tagLookup = spawnSync(
      'git',
      ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`],
      { encoding: 'utf8' }
    );
    assert.ok(
      tagLookup.status === 0 || tagLookup.status === 1,
      tagLookup.stderr || `não foi possível consultar ${tag}`
    );

    if (tagLookup.status === 0) {
      assert.equal(
        mode,
        'push',
        `${tag} já existe; incremente a versão test.N antes de integrar`
      );
      const taggedCommit = tagLookup.stdout.trim();
      const headCommit = execFileSync(
        'git',
        ['rev-parse', `${headRef}^{commit}`],
        { encoding: 'utf8' }
      ).trim();
      assert.equal(
        taggedCommit,
        headCommit,
        `${tag} já pertence a outro commit; incremente a versão test.N`
      );
    }
  }

  return channel;
}

function main() {
  const args = process.argv.slice(2);
  try {
    const result = classifyCandidate({
      baseRef: getOption(args, '--base'),
      headRef: getOption(args, '--head'),
      mode: getOption(args, '--mode')
    });
    console.log(result);
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  RELEASE_RELEVANT_PATHS,
  assertVersionTransition,
  classifyCandidate,
  compareCore,
  parseVersion
};
