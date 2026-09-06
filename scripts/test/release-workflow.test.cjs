const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const ci = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
const release = fs.readFileSync(
  path.join(root, '.github', 'workflows', 'release.yml'),
  'utf8'
);
const stable = fs.readFileSync(
  path.join(root, '.github', 'workflows', 'publish-stable.yml'),
  'utf8'
);
const guard = fs.readFileSync(
  path.join(root, '.github', 'workflows', 'release-guard.yml'),
  'utf8'
);

test('a branch test prepara uma pré-release somente depois dos jobs da CI', () => {
  assert.match(ci, /prepare-test-release:/);
  assert.match(ci, /github\.ref == 'refs\/heads\/test'/);
  assert.match(ci, /needs: \[app, desktop, appimage, codeql-release, release-contract\]/);
  assert.match(ci, /publish-test-release:/);
  assert.match(ci, /uses: \.\/\.github\/workflows\/release\.yml/);
});

test('a receita de AppImage pode ser reutilizada pela publicação automática', () => {
  assert.match(release, /workflow_call:/);
  assert.match(release, /RELEASE_TAG: \$\{\{ inputs\.release_tag \}\}/);
  assert.doesNotMatch(release, /^\s+release:\s*$/m);
});

test('a release estável exige e compara uma pré-release completa', () => {
  assert.match(release, /Exigir pré-release aprovada antes da versão estável/);
  assert.match(release, /verify-tested-prerelease\.cjs/);
  assert.match(release, /verify-promoted-source\.cjs "\$tested_tag" "\$RELEASE_TAG" origin\/test/);
});

test('uma release só fica visível depois dos dois pares do Gear Lever', () => {
  assert.match(release, /finalize:/);
  assert.match(release, /needs: appimage/);
  assert.match(release, /for arch in x86_64 aarch64/);
  assert.match(release, /--draft=false/);
  assert.match(ci, /gh release create "\$tag" --verify-tag --draft --prerelease/);
});

test('o canal test exige versão inédita e CodeQL antes de publicar', () => {
  assert.match(ci, /verify-test-candidate\.cjs/);
  assert.match(ci, /codeql-release:/);
  assert.match(ci, /name: CodeQL para publicação/);
});

test('main aceita somente a árvore integral da branch test', () => {
  assert.match(ci, /git diff --quiet origin\/test "\$GITHUB_SHA" -- \./);
  assert.match(ci, /não corresponde integralmente à branch test/);
});

test('a publicação estável possui uma única entrada manual controlada', () => {
  assert.match(stable, /workflow_dispatch:/);
  assert.match(stable, /ref: main/);
  assert.match(stable, /verify-tested-prerelease\.cjs/);
  assert.match(stable, /verify-promoted-source\.cjs/);
  assert.match(stable, /gh release create "\$tag" --verify-tag --draft --target main/);
  assert.match(stable, /uses: \.\/\.github\/workflows\/release\.yml/);
});

test('publicações manuais são removidas antes de afetar os canais', () => {
  assert.match(guard, /types: \[published\]/);
  assert.match(guard, /gh api --method DELETE/);
  assert.match(guard, /releases manuais são removidas/);
});
