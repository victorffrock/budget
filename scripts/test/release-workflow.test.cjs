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

test('a branch test prepara uma pré-release somente depois dos jobs da CI', () => {
  assert.match(ci, /prepare-test-release:/);
  assert.match(ci, /github\.ref == 'refs\/heads\/test'/);
  assert.match(ci, /needs: \[app, desktop, appimage, release-contract\]/);
  assert.match(ci, /publish-test-release:/);
  assert.match(ci, /uses: \.\/\.github\/workflows\/release\.yml/);
});

test('a receita de AppImage pode ser reutilizada pela publicação automática', () => {
  assert.match(release, /workflow_call:/);
  assert.match(release, /inputs\.release_tag \|\| github\.event\.release\.tag_name/);
});

test('a release estável exige e compara uma pré-release completa', () => {
  assert.match(release, /Exigir pré-release aprovada antes da versão estável/);
  assert.match(release, /verify-tested-prerelease\.cjs/);
  assert.match(release, /verify-promoted-source\.cjs "\$tested_tag" "\$RELEASE_TAG"/);
});
