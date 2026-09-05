const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isSafeExternalUrl,
  openExternalIfSafe,
  installNavigationGuard
} = require('../navigation.js');

test('aceita apenas links HTTPS para abertura externa', () => {
  assert.equal(isSafeExternalUrl('https://github.com/victorffrock/budget'), true);
  assert.equal(isSafeExternalUrl('http://example.com'), false);
  assert.equal(isSafeExternalUrl('file:///etc/passwd'), false);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('not a url'), false);
});

test('abre somente links seguros no navegador padrão', () => {
  const opened = [];
  const shell = { openExternal: (url) => opened.push(url) };

  assert.equal(openExternalIfSafe(shell, 'https://github.com/victorffrock/budget'), true);
  assert.equal(openExternalIfSafe(shell, 'file:///tmp/untrusted'), false);
  assert.deepEqual(opened, ['https://github.com/victorffrock/budget']);
});

test('falha ao abrir um link externo sem interromper o aplicativo', () => {
  const shell = { openExternal: () => { throw new Error('indisponível'); } };
  assert.equal(openExternalIfSafe(shell, 'https://github.com/victorffrock/budget'), false);
});

test('bloqueia novas janelas e navegações internas antes de abrir um link seguro', () => {
  const opened = [];
  const listeners = new Map();
  let windowOpenHandler;
  const webContents = {
    setWindowOpenHandler: (handler) => { windowOpenHandler = handler; },
    on: (event, handler) => listeners.set(event, handler)
  };
  const shell = { openExternal: (url) => opened.push(url) };

  installNavigationGuard(webContents, shell);

  assert.deepEqual(
    windowOpenHandler({ url: 'https://github.com/victorffrock/budget' }),
    { action: 'deny' }
  );
  assert.deepEqual(windowOpenHandler({ url: 'file:///tmp/untrusted' }), { action: 'deny' });

  let prevented = false;
  listeners.get('will-navigate')({ preventDefault: () => { prevented = true; } }, 'https://github.com/victorffrock/budget');

  assert.equal(prevented, true);
  assert.deepEqual(opened, [
    'https://github.com/victorffrock/budget',
    'https://github.com/victorffrock/budget'
  ]);
});
