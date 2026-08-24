import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAndroidVersion } from '../scripts/version.mjs';

function parseVersion(version) {
  const resolved = resolveAndroidVersion(version);
  return {
    version_name: String(resolved.versionName),
    version_code: String(resolved.versionCode)
  };
}

test('converte SemVer estável em versão e código Android monotônicos', () => {
  assert.deepEqual(parseVersion('6.0.0'), {
    version_name: '6.0.0',
    version_code: '6000099'
  });
  assert.equal(Number(parseVersion('6.1.0').version_code) > Number(parseVersion('6.0.1').version_code), true);
});

test('reserva códigos inferiores para pré-releases', () => {
  const prerelease = Number(parseVersion('6.1.0-test.2').version_code);
  const stable = Number(parseVersion('6.1.0').version_code);
  assert.equal(prerelease < stable, true);
});
