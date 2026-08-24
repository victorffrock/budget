(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BudgetTheme = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var THEME_STORAGE_KEY = 'budget-theme';
  var VALID_PREFERENCES = Object.freeze(['auto', 'light', 'dark']);

  function normalizePreference(value) {
    return VALID_PREFERENCES.indexOf(value) >= 0 ? value : 'auto';
  }

  function getEffectiveTheme(preference, prefersDark) {
    var normalized = normalizePreference(preference);
    if (normalized === 'auto') return prefersDark ? 'dark' : 'light';
    return normalized;
  }

  function getStoredPreference(storage) {
    try {
      return normalizePreference(storage && storage.getItem(THEME_STORAGE_KEY));
    } catch (_error) {
      // Abrir o HTML diretamente pode bloquear localStorage em alguns navegadores.
      // Nesse caso o aplicativo continua funcional usando o tema automático.
      return 'auto';
    }
  }

  function storePreference(storage, preference) {
    try {
      if (storage) storage.setItem(THEME_STORAGE_KEY, preference);
    } catch (_error) {
      // A preferência é opcional: falhar ao salvá-la nunca deve impedir o uso.
    }
  }

  function createThemeController(options) {
    var documentRef = options.document;
    var storage = options.storage;
    var mediaQuery = options.mediaQuery || {
      matches: false,
      addEventListener: function () {},
      removeEventListener: function () {}
    };
    var preference = getStoredPreference(storage);

    function updateControls() {
      var controls = documentRef.querySelectorAll('[data-theme-preference]');
      Array.prototype.forEach.call(controls, function (control) {
        var selected = control.dataset.themePreference === preference;
        control.setAttribute('aria-checked', String(selected));
      });
    }

    function apply() {
      var effectiveTheme = getEffectiveTheme(preference, Boolean(mediaQuery.matches));
      documentRef.documentElement.dataset.theme = preference;
      documentRef.documentElement.dataset.effectiveTheme = effectiveTheme;

      var themeColor = documentRef.querySelector('meta[name="theme-color"]');
      if (themeColor) themeColor.setAttribute('content', effectiveTheme === 'dark' ? '#242424' : '#f6f5f4');
      updateControls();
    }

    function setPreference(value) {
      preference = normalizePreference(value);
      storePreference(storage, preference);
      apply();
      return preference;
    }

    function onSystemThemeChange() {
      if (preference === 'auto') apply();
    }

    if (typeof mediaQuery.addEventListener === 'function') mediaQuery.addEventListener('change', onSystemThemeChange);
    else if (typeof mediaQuery.addListener === 'function') mediaQuery.addListener(onSystemThemeChange);
    apply();

    return Object.freeze({
      getPreference: function () { return preference; },
      setPreference: setPreference,
      dispose: function () {
        if (typeof mediaQuery.removeEventListener === 'function') mediaQuery.removeEventListener('change', onSystemThemeChange);
        else if (typeof mediaQuery.removeListener === 'function') mediaQuery.removeListener(onSystemThemeChange);
      }
    });
  }

  return Object.freeze({
    THEME_STORAGE_KEY: THEME_STORAGE_KEY,
    createThemeController: createThemeController,
    getEffectiveTheme: getEffectiveTheme,
    normalizePreference: normalizePreference
  });
});
