(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BudgetTheme = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var THEME_STORAGE_KEY = 'budget-theme';
  var VALID_PREFERENCES = Object.freeze(['auto', 'light', 'dark']);
  var DEFAULT_SYSTEM_ACCENT = Object.freeze({
    name: 'blue',
    background: '#3584e4',
    light: '#0461be',
    dark: '#81d0ff'
  });

  function isHexColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  }

  function normalizeSystemAccent(value) {
    if (!value || typeof value !== 'object') return DEFAULT_SYSTEM_ACCENT;
    if (!isHexColor(value.background) || !isHexColor(value.light) || !isHexColor(value.dark)) {
      return DEFAULT_SYSTEM_ACCENT;
    }
    return Object.freeze({
      name: typeof value.name === 'string' && /^[a-z-]+$/i.test(value.name) ? value.name.toLowerCase() : 'system',
      background: value.background.toLowerCase(),
      light: value.light.toLowerCase(),
      dark: value.dark.toLowerCase()
    });
  }

  function mixHexColor(source, target, amount) {
    var sourceValue = parseInt(source.slice(1), 16);
    var targetValue = parseInt(target.slice(1), 16);
    var channels = [16, 8, 0].map(function (shift) {
      var from = (sourceValue >> shift) & 255;
      var to = (targetValue >> shift) & 255;
      return Math.round(from + (to - from) * amount).toString(16).padStart(2, '0');
    });
    return '#' + channels.join('');
  }

  function getAccentHoverColor(accent, effectiveTheme) {
    // Libadwaita deixa o estado hover ligeiramente mais claro no escuro e
    // mais escuro no claro. A mistura pequena mantém o contraste e funciona
    // também para futuras cores de destaque do GNOME.
    return mixHexColor(accent.background, effectiveTheme === 'dark' ? '#ffffff' : '#000000', 0.14);
  }

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
    var systemAccent = normalizeSystemAccent(options.systemAccent);

    function updateControls() {
      var controls = documentRef.querySelectorAll('[data-theme-preference]');
      Array.prototype.forEach.call(controls, function (control) {
        var selected = control.dataset.themePreference === preference;
        control.setAttribute('aria-checked', String(selected));
      });
    }

    function apply() {
      var effectiveTheme = getEffectiveTheme(preference, Boolean(mediaQuery.matches));
      var root = documentRef.documentElement;
      root.dataset.theme = preference;
      root.dataset.effectiveTheme = effectiveTheme;
      root.dataset.systemAccent = systemAccent.name;

      // O app web não recebe a preferência de cor do sistema: nesse caso, a
      // paleta azul do GNOME permanece como fallback. No Electron, o preload
      // entrega somente valores validados pelo processo principal.
      if (root.style && typeof root.style.setProperty === 'function') {
        root.style.setProperty('--accent-bg', systemAccent.background);
        root.style.setProperty('--accent-standalone', effectiveTheme === 'dark' ? systemAccent.dark : systemAccent.light);
        root.style.setProperty('--accent-hover', getAccentHoverColor(systemAccent, effectiveTheme));
      }

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

    function setSystemAccent(value) {
      systemAccent = normalizeSystemAccent(value);
      apply();
      return systemAccent;
    }

    function onSystemThemeChange() {
      if (preference === 'auto') apply();
    }

    if (typeof mediaQuery.addEventListener === 'function') mediaQuery.addEventListener('change', onSystemThemeChange);
    else if (typeof mediaQuery.addListener === 'function') mediaQuery.addListener(onSystemThemeChange);
    apply();

    return Object.freeze({
      getPreference: function () { return preference; },
      getSystemAccent: function () { return systemAccent; },
      setPreference: setPreference,
      setSystemAccent: setSystemAccent,
      dispose: function () {
        if (typeof mediaQuery.removeEventListener === 'function') mediaQuery.removeEventListener('change', onSystemThemeChange);
        else if (typeof mediaQuery.removeListener === 'function') mediaQuery.removeListener(onSystemThemeChange);
      }
    });
  }

  return Object.freeze({
    THEME_STORAGE_KEY: THEME_STORAGE_KEY,
    DEFAULT_SYSTEM_ACCENT: DEFAULT_SYSTEM_ACCENT,
    createThemeController: createThemeController,
    getEffectiveTheme: getEffectiveTheme,
    getAccentHoverColor: getAccentHoverColor,
    normalizeSystemAccent: normalizeSystemAccent,
    normalizePreference: normalizePreference
  });
});
