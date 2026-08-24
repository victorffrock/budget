/*
 * Integração opcional com a cor de destaque do GNOME.
 *
 * O processo principal consulta somente a chave pública de aparência do
 * GNOME. O renderer recebe cores validadas pelo módulo de tema, preservando o
 * isolamento de contexto do Electron. Caso o GNOME ou o gsettings não estejam
 * disponíveis, o aplicativo continua usando a paleta azul padrão.
 */
'use strict';

const { execFile, spawn } = require('node:child_process');

// Cores de destaque e cores "standalone" oficiais do Libadwaita 1.6+.
// A segunda é usada em textos, bordas de foco e ícones, onde precisa manter
// contraste com o fundo claro ou escuro.
const GNOME_ACCENTS = Object.freeze({
  blue: Object.freeze({ background: '#3584e4', light: '#0461be', dark: '#81d0ff' }),
  teal: Object.freeze({ background: '#2190a4', light: '#007184', dark: '#7bdff4' }),
  green: Object.freeze({ background: '#3a944a', light: '#15772e', dark: '#8de698' }),
  yellow: Object.freeze({ background: '#c88800', light: '#905300', dark: '#ffc057' }),
  orange: Object.freeze({ background: '#ed5b00', light: '#b62200', dark: '#ff9c5b' }),
  red: Object.freeze({ background: '#e62d42', light: '#c00023', dark: '#ff888c' }),
  pink: Object.freeze({ background: '#d56199', light: '#a2326c', dark: '#ffa0d8' }),
  purple: Object.freeze({ background: '#9141ac', light: '#8939a4', dark: '#fba7ff' }),
  slate: Object.freeze({ background: '#6f8396', light: '#526678', dark: '#bbd1e5' })
});

function accentPayload(name) {
  const colors = GNOME_ACCENTS[name];
  if (!colors) return null;
  return Object.freeze({ name, background: colors.background, light: colors.light, dark: colors.dark });
}

function parseAccentName(output) {
  // O gsettings imprime, por exemplo: "'purple'" ou
  // "accent-color: 'purple'" quando executado em modo monitor.
  const match = /'([a-z-]+)'/i.exec(String(output || ''));
  if (!match) return null;
  const name = match[1].toLowerCase();
  return Object.prototype.hasOwnProperty.call(GNOME_ACCENTS, name) ? name : null;
}

function createGnomeAccentService(options = {}) {
  const platform = options.platform || process.platform;
  const run = options.execFile || execFile;
  const startProcess = options.spawn || spawn;
  const onAccentChange = typeof options.onAccentChange === 'function' ? options.onAccentChange : () => {};
  let monitor = null;
  let bufferedOutput = '';
  let currentAccent = null;
  let stopped = false;

  function publish(name) {
    const nextAccent = accentPayload(name);
    if (!nextAccent || (currentAccent && currentAccent.name === nextAccent.name)) return;
    currentAccent = nextAccent;
    onAccentChange(nextAccent);
  }

  function readCurrentAccent() {
    // execFile evita interpretar qualquer valor como comando de shell.
    run(
      'gsettings',
      ['get', 'org.gnome.desktop.interface', 'accent-color'],
      { encoding: 'utf8', timeout: 1500, windowsHide: true },
      (error, stdout) => {
        if (stopped || error) return;
        publish(parseAccentName(stdout));
      }
    );
  }

  function processMonitorOutput(chunk) {
    bufferedOutput += String(chunk || '');
    let newlineIndex = bufferedOutput.indexOf('\n');
    while (newlineIndex >= 0) {
      publish(parseAccentName(bufferedOutput.slice(0, newlineIndex)));
      bufferedOutput = bufferedOutput.slice(newlineIndex + 1);
      newlineIndex = bufferedOutput.indexOf('\n');
    }
  }

  function start() {
    if (platform !== 'linux' || stopped || monitor) return;
    readCurrentAccent();

    try {
      monitor = startProcess(
        'gsettings',
        ['monitor', 'org.gnome.desktop.interface', 'accent-color'],
        { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }
      );
      if (monitor.stdout) {
        monitor.stdout.setEncoding('utf8');
        monitor.stdout.on('data', processMonitorOutput);
      }
      monitor.once('error', () => { monitor = null; });
      monitor.once('exit', () => { monitor = null; });
    } catch (_error) {
      // Ambientes sem gsettings (ou sem sessão do GNOME) usam o azul padrão.
      monitor = null;
    }
  }

  function stop() {
    stopped = true;
    if (monitor && !monitor.killed) monitor.kill();
    monitor = null;
  }

  return Object.freeze({
    getAccent: () => currentAccent,
    processMonitorOutput,
    start,
    stop
  });
}

module.exports = Object.freeze({
  GNOME_ACCENTS,
  accentPayload,
  createGnomeAccentService,
  parseAccentName
});
