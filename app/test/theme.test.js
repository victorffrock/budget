const test = require('node:test');
const assert = require('node:assert/strict');
const Theme = require('../src/theme.js');

function createStorage(initialValue) {
  let value = initialValue;
  return {
    getItem() { return value; },
    setItem(_key, nextValue) { value = nextValue; },
    get value() { return value; }
  };
}

function createMediaQuery(matches) {
  let listener = null;
  return {
    matches,
    addEventListener(event, callback) { if (event === 'change') listener = callback; },
    removeEventListener() { listener = null; },
    change(nextMatches) {
      this.matches = nextMatches;
      if (listener) listener({ matches: nextMatches });
    }
  };
}

function createDocument() {
  const controls = ['auto', 'light', 'dark'].map((preference) => ({
    dataset: { themePreference: preference },
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  }));
  const themeColor = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  return {
    documentElement: { dataset: {} },
    controls,
    themeColor,
    querySelectorAll(selector) { return selector === '[data-theme-preference]' ? controls : []; },
    querySelector(selector) { return selector === 'meta[name="theme-color"]' ? themeColor : null; }
  };
}

test('normaliza preferências e resolve o tema automático', () => {
  assert.equal(Theme.normalizePreference('dark'), 'dark');
  assert.equal(Theme.normalizePreference('unexpected'), 'auto');
  assert.equal(Theme.getEffectiveTheme('auto', true), 'dark');
  assert.equal(Theme.getEffectiveTheme('auto', false), 'light');
  assert.equal(Theme.getEffectiveTheme('light', true), 'light');
});

test('restaura a preferência salva e acompanha mudanças do sistema no modo automático', () => {
  const documentRef = createDocument();
  const mediaQuery = createMediaQuery(false);
  const controller = Theme.createThemeController({
    document: documentRef,
    storage: createStorage('auto'),
    mediaQuery
  });

  assert.equal(controller.getPreference(), 'auto');
  assert.equal(documentRef.documentElement.dataset.effectiveTheme, 'light');
  assert.equal(documentRef.themeColor.attributes.content, '#f6f5f4');

  mediaQuery.change(true);
  assert.equal(documentRef.documentElement.dataset.effectiveTheme, 'dark');
  assert.equal(documentRef.themeColor.attributes.content, '#242424');
});

test('salva a escolha manual e atualiza os controles acessíveis', () => {
  const documentRef = createDocument();
  const storage = createStorage(null);
  const controller = Theme.createThemeController({
    document: documentRef,
    storage,
    mediaQuery: createMediaQuery(false)
  });

  controller.setPreference('dark');
  assert.equal(storage.value, 'dark');
  assert.equal(documentRef.documentElement.dataset.theme, 'dark');
  assert.equal(documentRef.documentElement.dataset.effectiveTheme, 'dark');
  assert.deepEqual(documentRef.controls.map((control) => control.attributes['aria-checked']), ['false', 'false', 'true']);
});

test('usa automático quando o armazenamento local não está disponível', () => {
  const documentRef = createDocument();
  const controller = Theme.createThemeController({
    document: documentRef,
    storage: { getItem() { throw new Error('indisponível'); } },
    mediaQuery: createMediaQuery(false)
  });

  assert.equal(controller.getPreference(), 'auto');
  assert.equal(documentRef.documentElement.dataset.effectiveTheme, 'light');
});
