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
const buildAppImage = fs.readFileSync(
  path.join(root, 'scripts', 'build-appimage.sh'),
  'utf8'
);
const desktopPackage = require(path.join(root, 'desktop', 'package.json'));

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
  assert.match(release, /RELEASE_ID: \$\{\{ inputs\.release_id \}\}/);
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
  assert.match(release, /\{draft:false, prerelease:\$prerelease/);
  assert.match(release, /releases\/\$RELEASE_ID/);
  assert.match(ci, /tag_name:\$tag/);
  assert.match(ci, /draft:true/);
  assert.match(ci, /prerelease:true/);
});

test('a release estável publica uma única identidade canônica por arquitetura', () => {
  assert.match(release, /appimage_name="Budget-\$BUDGET_APPIMAGE_ARCH\.AppImage"/);
  assert.match(release, /"desktop\/dist\/\$BUDGET_APPIMAGE_FILENAME\.zsync"/);
  assert.doesNotMatch(release, /legacy_version/);
  assert.doesNotMatch(release, /Budget-6\.1\.[34]-/);
  assert.doesNotMatch(release, /desktop\/dist\/Budget-\*-\$BUDGET_APPIMAGE_ARCH/);
  assert.match(buildAppImage, /APPIMAGE_ARTIFACT_NAME="Budget-\$\{APPIMAGE_ARCH\}\.\\\$\{ext\}"/);
  assert.doesNotMatch(buildAppImage, /Budget-\\\$\{version\}-\$\{APPIMAGE_ARCH\}/);
  assert.equal(desktopPackage.build.artifactName, 'Budget-x86_64.${ext}');
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
  assert.match(stable, /target_commitish:"main"/);
  assert.match(stable, /prerelease:false/);
  assert.match(stable, /release_id: \$\{\{ needs\.prepare\.outputs\.release_id \}\}/);
  assert.match(stable, /uses: \.\/\.github\/workflows\/release\.yml/);
});

test('publicações manuais são removidas antes de afetar os canais', () => {
  assert.match(guard, /types: \[published\]/);
  assert.match(guard, /gh api --method DELETE/);
  assert.match(guard, /releases manuais são removidas/);
});
