const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const appPackage = require(path.join(root, 'app', 'package.json'));
const desktopPackage = require(path.join(root, 'desktop', 'package.json'));
const desktopLock = require(path.join(root, 'desktop', 'package-lock.json'));

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }
  return 0;
}

test('a versão autorizada do Electron acompanha pacote e lockfile', () => {
  const electronVersion = desktopPackage.devDependencies.electron;
  const electronPermission = `electron@${electronVersion}`;
  const electronPermissions = Object.keys(desktopPackage.allowScripts)
    .filter((entry) => entry.startsWith('electron@'));

  assert.equal(desktopLock.packages[''].devDependencies.electron, electronVersion);
  assert.equal(
    desktopLock.packages['node_modules/electron'].version,
    electronVersion
  );
  assert.deepEqual(electronPermissions, [electronPermission]);
  assert.equal(desktopPackage.allowScripts[electronPermission], true);
});

test('o postinstall informativo do OCR permanece explicitamente bloqueado', () => {
  assert.equal(appPackage.allowScripts['tesseract.js'], false);
});

test('nenhuma cópia do js-yaml 4 usa versão anterior à correção de segurança', () => {
  const yamlPackages = Object.entries(desktopLock.packages)
    .filter(([packagePath]) => packagePath.endsWith('node_modules/js-yaml'));

  assert.ok(yamlPackages.length > 0, 'js-yaml não foi encontrado no lockfile');
  for (const [packagePath, metadata] of yamlPackages) {
    if (!metadata.version.startsWith('4.')) continue;
    assert.ok(
      compareVersions(metadata.version, '4.3.2') >= 0,
      `${packagePath} ainda usa js-yaml vulnerável ${metadata.version}`
    );
  }
});

test('todas as etapas do CodeQL usam o mesmo commit imutável', () => {
  const workflowFiles = ['ci.yml', 'codeql.yml'];
  const codeqlUses = workflowFiles.flatMap((file) => {
    const workflow = fs.readFileSync(
      path.join(root, '.github', 'workflows', file),
      'utf8'
    );
    return [...workflow.matchAll(
      /github\/codeql-action\/(?:init|analyze)@([0-9a-f]{40}) # v(\d+\.\d+\.\d+)/g
    )];
  });

  assert.equal(codeqlUses.length, 4);
  assert.equal(new Set(codeqlUses.map((match) => match[1])).size, 1);
  assert.equal(new Set(codeqlUses.map((match) => match[2])).size, 1);
});

test('a CI não executa scripts de instalação de dependências indiscriminadamente', () => {
  const workflowFiles = ['ci.yml', 'release.yml'];
  for (const file of workflowFiles) {
    const workflow = fs.readFileSync(
      path.join(root, '.github', 'workflows', file),
      'utf8'
    );
    const desktopInstalls = workflow.match(/npm ci --ignore-scripts/g) || [];
    assert.ok(desktopInstalls.length > 0, `${file} deve bloquear scripts no npm ci`);
    assert.match(workflow, /node node_modules\/electron\/install\.js/);
  }
});

test('o Dependabot agrupa cada ecossistema e sempre aponta para test', () => {
  const config = fs.readFileSync(
    path.join(root, '.github', 'dependabot.yml'),
    'utf8'
  );

  assert.equal((config.match(/target-branch: test/g) || []).length, 3);
  assert.match(config, /app-dependencies:\s+patterns:\s+- "\*"/);
  assert.match(config, /desktop-dependencies:\s+patterns:\s+- "\*"/);
  assert.match(config, /workflow-actions:\s+patterns:\s+- "\*"/);
});
