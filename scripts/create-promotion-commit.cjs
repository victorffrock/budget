#!/usr/bin/env node
/*
 * Cria o único commit necessário para promover a árvore atual de `test` para
 * `main` quando as duas branches possuem históricos lineares independentes.
 *
 * O commit produzido tem como pai a ponta de `main` e reutiliza, sem alterar,
 * a árvore de `test`. O script nunca move branches: o workflow responsável
 * valida o resultado e publica uma branch temporária separadamente.
 */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const VERSION_FILES = Object.freeze([
  ['app/package.json', (manifest) => manifest.version],
  ['app/package-lock.json', (manifest) => manifest.version],
  ['app/package-lock.json#packages[""]', (manifest) => manifest.packages?.['']?.version],
  ['desktop/package.json', (manifest) => manifest.version],
  ['desktop/package-lock.json', (manifest) => manifest.version],
  ['desktop/package-lock.json#packages[""]', (manifest) => manifest.packages?.['']?.version]
]);

function runGit(repoDir, args, options = {}) {
  const result = spawnSync('git', ['-C', repoDir, ...args], {
    encoding: 'utf8',
    input: options.input,
    env: options.env || process.env
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} falhou${detail ? `: ${detail}` : ''}`);
  }

  return result.stdout.trim();
}

function readJsonAtRef(repoDir, ref, file) {
  return JSON.parse(runGit(repoDir, ['show', `${ref}:${file}`]));
}

function assertStableVersion(version) {
  assert.match(
    version || '',
    STABLE_VERSION_PATTERN,
    'informe uma versão estável no formato X.Y.Z'
  );
}

function assertVersionAtRef(repoDir, ref, expectedVersion) {
  const manifests = new Map();

  for (const [label, readVersion] of VERSION_FILES) {
    const file = label.split('#')[0];
    if (!manifests.has(file)) {
      manifests.set(file, readJsonAtRef(repoDir, ref, file));
    }

    assert.equal(
      readVersion(manifests.get(file)),
      expectedVersion,
      `${label} deve usar a versão ${expectedVersion}`
    );
  }
}

function resolveCommit(repoDir, ref) {
  return runGit(repoDir, ['rev-parse', '--verify', `${ref}^{commit}`]);
}

function resolveTree(repoDir, ref) {
  return runGit(repoDir, ['rev-parse', '--verify', `${ref}^{tree}`]);
}

function assertPromotionCommit(repoDir, promotionRef, mainCommit, testTree) {
  const promotionCommit = resolveCommit(repoDir, promotionRef);
  const promotionTree = resolveTree(repoDir, promotionCommit);
  const parents = runGit(repoDir, ['show', '-s', '--format=%P', promotionCommit])
    .split(/\s+/)
    .filter(Boolean);

  assert.equal(
    promotionTree,
    testTree,
    `${promotionRef} não contém exatamente a árvore atual de test`
  );
  assert.deepEqual(
    parents,
    [mainCommit],
    `${promotionRef} deve possuir somente a ponta atual de main como pai`
  );

  return promotionCommit;
}

function createPromotionCommit({
  repoDir = process.cwd(),
  version,
  mainRef = 'origin/main',
  testRef = 'origin/test',
  promotionRef,
  authorName = 'github-actions[bot]',
  authorEmail = '41898282+github-actions[bot]@users.noreply.github.com'
}) {
  assertStableVersion(version);
  assertVersionAtRef(repoDir, testRef, version);

  const mainCommit = resolveCommit(repoDir, mainRef);
  const testCommit = resolveCommit(repoDir, testRef);
  const mainTree = resolveTree(repoDir, mainCommit);
  const testTree = resolveTree(repoDir, testCommit);
  const branch = `release/${version}-main`;

  if (mainTree === testTree) {
    return {
      status: 'already-promoted',
      branch,
      commit: mainCommit,
      mainCommit,
      testCommit,
      tree: testTree
    };
  }

  if (promotionRef) {
    return {
      status: 'existing',
      branch,
      commit: assertPromotionCommit(repoDir, promotionRef, mainCommit, testTree),
      mainCommit,
      testCommit,
      tree: testTree
    };
  }

  const identity = {
    ...process.env,
    GIT_AUTHOR_NAME: authorName,
    GIT_AUTHOR_EMAIL: authorEmail,
    GIT_COMMITTER_NAME: authorName,
    GIT_COMMITTER_EMAIL: authorEmail
  };
  const commit = runGit(
    repoDir,
    ['commit-tree', testTree, '-p', mainCommit],
    {
      input: `Promove versão estável ${version}\n`,
      env: identity
    }
  );

  assertPromotionCommit(repoDir, commit, mainCommit, testTree);

  const diff = spawnSync(
    'git',
    ['-C', repoDir, 'diff', '--quiet', testCommit, commit, '--', '.'],
    { encoding: 'utf8' }
  );
  assert.equal(diff.status, 0, 'o commit de promoção alterou a árvore aprovada em test');

  return {
    status: 'created',
    branch,
    commit,
    mainCommit,
    testCommit,
    tree: testTree
  };
}

function main() {
  try {
    const result = createPromotionCommit({
      version: process.argv[2],
      promotionRef: process.argv[3]
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  STABLE_VERSION_PATTERN,
  VERSION_FILES,
  assertPromotionCommit,
  assertStableVersion,
  assertVersionAtRef,
  createPromotionCommit,
  runGit
};
