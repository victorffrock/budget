const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  assertStableVersion,
  createPromotionCommit
} = require('../create-promotion-commit.cjs');

function git(repoDir, ...args) {
  return execFileSync('git', ['-C', repoDir, ...args], {
    encoding: 'utf8'
  }).trim();
}

function writeManifestFixture(repoDir, version) {
  for (const directory of ['app', 'desktop']) {
    fs.mkdirSync(path.join(repoDir, directory), { recursive: true });
    fs.writeFileSync(
      path.join(repoDir, directory, 'package.json'),
      `${JSON.stringify({ name: `budget-${directory}`, version }, null, 2)}\n`
    );
    fs.writeFileSync(
      path.join(repoDir, directory, 'package-lock.json'),
      `${JSON.stringify({
        name: `budget-${directory}`,
        version,
        lockfileVersion: 3,
        packages: { '': { name: `budget-${directory}`, version } }
      }, null, 2)}\n`
    );
  }
}

function createDivergedRepository() {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'budget-promotion-'));
  git(repoDir, 'init', '--initial-branch=main');
  git(repoDir, 'config', 'user.name', 'Budget Tests');
  git(repoDir, 'config', 'user.email', 'tests@example.invalid');

  writeManifestFixture(repoDir, '6.2.0');
  fs.writeFileSync(path.join(repoDir, 'state.txt'), 'base\n');
  git(repoDir, 'add', '.');
  git(repoDir, 'commit', '-m', 'Base comum');
  const baseCommit = git(repoDir, 'rev-parse', 'HEAD');

  fs.writeFileSync(path.join(repoDir, 'state.txt'), 'main anterior\n');
  git(repoDir, 'commit', '-am', 'Histórico linear de main');
  const mainCommit = git(repoDir, 'rev-parse', 'HEAD');

  git(repoDir, 'switch', '--create', 'test', baseCommit);
  fs.writeFileSync(path.join(repoDir, 'state.txt'), 'test aprovada\n');
  git(repoDir, 'commit', '-am', 'Histórico linear de test');
  const testCommit = git(repoDir, 'rev-parse', 'HEAD');

  return { repoDir, mainCommit, testCommit };
}

test('cria um commit com pai em main e árvore idêntica a test', (t) => {
  const fixture = createDivergedRepository();
  t.after(() => fs.rmSync(fixture.repoDir, { recursive: true, force: true }));

  const result = createPromotionCommit({
    repoDir: fixture.repoDir,
    version: '6.2.0',
    mainRef: fixture.mainCommit,
    testRef: fixture.testCommit,
    authorName: 'Budget Tests',
    authorEmail: 'tests@example.invalid'
  });

  assert.equal(result.status, 'created');
  assert.equal(result.mainCommit, fixture.mainCommit);
  assert.equal(result.testCommit, fixture.testCommit);
  assert.equal(git(fixture.repoDir, 'show', '-s', '--format=%P', result.commit), fixture.mainCommit);
  assert.equal(
    git(fixture.repoDir, 'rev-parse', `${result.commit}^{tree}`),
    git(fixture.repoDir, 'rev-parse', `${fixture.testCommit}^{tree}`)
  );
  assert.equal(git(fixture.repoDir, 'diff', '--name-only', result.commit, fixture.testCommit), '');
  assert.equal(git(fixture.repoDir, 'branch', '--show-current'), 'test');

  git(fixture.repoDir, 'update-ref', 'refs/heads/release/6.2.0-main', result.commit);
  const reused = createPromotionCommit({
    repoDir: fixture.repoDir,
    version: '6.2.0',
    mainRef: fixture.mainCommit,
    testRef: fixture.testCommit,
    promotionRef: 'release/6.2.0-main'
  });
  assert.equal(reused.status, 'existing');
  assert.equal(reused.commit, result.commit);

  const promoted = createPromotionCommit({
    repoDir: fixture.repoDir,
    version: '6.2.0',
    mainRef: result.commit,
    testRef: fixture.testCommit
  });
  assert.equal(promoted.status, 'already-promoted');
});

test('recusa versões de teste, versões divergentes e branches reaproveitadas incorretamente', (t) => {
  const fixture = createDivergedRepository();
  t.after(() => fs.rmSync(fixture.repoDir, { recursive: true, force: true }));

  assert.throws(() => assertStableVersion('6.2.0-test.1'), /formato X\.Y\.Z/);
  assert.throws(
    () => createPromotionCommit({
      repoDir: fixture.repoDir,
      version: '6.2.1',
      mainRef: fixture.mainCommit,
      testRef: fixture.testCommit
    }),
    /deve usar a versão 6\.2\.1/
  );
  assert.throws(
    () => createPromotionCommit({
      repoDir: fixture.repoDir,
      version: '6.2.0',
      mainRef: fixture.mainCommit,
      testRef: fixture.testCommit,
      promotionRef: fixture.testCommit
    }),
    /deve possuir somente a ponta atual de main como pai/
  );
});
