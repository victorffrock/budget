#!/usr/bin/env node
/*
 * Localiza e valida releases inclusive enquanto ainda são rascunhos. O
 * endpoint /releases/tags não expõe rascunhos; por isso a automação consulta
 * a lista autenticada e usa o ID imutável nas etapas seguintes.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');

function findRelease(input, { tag, channel, requireDraft = false }) {
  const releases = Array.isArray(input) ? input : [input];
  const release = releases.find((candidate) => candidate.tag_name === tag);
  assert.ok(release, `release ${tag} não encontrada`);

  const prerelease = channel === 'test';
  const target = prerelease ? 'test' : 'main';
  assert.ok(['test', 'stable'].includes(channel), 'canal inválido');
  assert.equal(release.prerelease, prerelease, `${tag} possui tipo de release incorreto`);
  assert.equal(release.target_commitish, target, `${tag} aponta para a branch incorreta`);
  if (requireDraft) {
    assert.equal(release.draft, true, `${tag} precisa permanecer como rascunho`);
  }
  assert.ok(Number.isInteger(release.id), `${tag} não possui ID de release válido`);
  return release;
}

function getOption(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function main() {
  const args = process.argv.slice(2);
  try {
    const release = findRelease(JSON.parse(fs.readFileSync(0, 'utf8')), {
      tag: getOption(args, '--tag'),
      channel: getOption(args, '--channel'),
      requireDraft: args.includes('--require-draft')
    });
    const field = getOption(args, '--field') || 'id';
    if (field === 'id') console.log(release.id);
    else if (field === 'state') console.log(release.draft ? 'draft' : 'published');
    else if (field === 'assets') {
      for (const asset of release.assets || []) console.log(asset.name);
    } else assert.fail(`campo de saída inválido: ${field}`);
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { findRelease };
