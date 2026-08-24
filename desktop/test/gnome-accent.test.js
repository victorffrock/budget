const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const {
  accentPayload,
  createGnomeAccentService,
  parseAccentName
} = require('../gnome-accent.js');
const desktopPackage = require('../package.json');

function createMonitor() {
  const monitor = new EventEmitter();
  monitor.stdout = new EventEmitter();
  monitor.stdout.setEncoding = () => {};
  monitor.killed = false;
  monitor.kill = () => { monitor.killed = true; };
  return monitor;
}

test('reconhece somente as cores oficiais de destaque do GNOME', () => {
  assert.equal(parseAccentName("'purple'"), 'purple');
  assert.equal(parseAccentName("accent-color: 'TeAl'"), 'teal');
  assert.equal(parseAccentName("accent-color: 'custom; rm -rf /'"), null);
  assert.equal(parseAccentName('accent-color: invalid'), null);
  assert.deepEqual(accentPayload('red'), {
    name: 'red',
    background: '#e62d42',
    light: '#c00023',
    dark: '#ff888c'
  });
});

test('consulta e acompanha mudanças sem executar um shell', () => {
  const execCalls = [];
  const spawnCalls = [];
  const received = [];
  const monitor = createMonitor();
  const service = createGnomeAccentService({
    platform: 'linux',
    onAccentChange: (accent) => received.push(accent),
    execFile: (file, args, options, callback) => {
      execCalls.push({ file, args, options });
      callback(null, "'green'\n");
    },
    spawn: (file, args, options) => {
      spawnCalls.push({ file, args, options });
      return monitor;
    }
  });

  service.start();
  assert.deepEqual(execCalls[0], {
    file: 'gsettings',
    args: ['get', 'org.gnome.desktop.interface', 'accent-color'],
    options: { encoding: 'utf8', timeout: 1500, windowsHide: true }
  });
  assert.deepEqual(spawnCalls[0], {
    file: 'gsettings',
    args: ['monitor', 'org.gnome.desktop.interface', 'accent-color'],
    options: { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }
  });
  assert.equal(received[0].name, 'green');

  monitor.stdout.emit('data', "accent-color: 'purple'\n");
  assert.equal(service.getAccent().name, 'purple');
  assert.equal(received[1].background, '#9141ac');

  service.stop();
  assert.equal(monitor.killed, true);
});

test('não tenta integrar em plataformas fora do Linux', () => {
  let called = false;
  const service = createGnomeAccentService({
    platform: 'darwin',
    execFile: () => { called = true; },
    spawn: () => { called = true; }
  });

  service.start();
  assert.equal(called, false);
  assert.equal(service.getAccent(), null);
});

test('inclui o módulo de integração no AppImage', () => {
  assert.ok(desktopPackage.build.files.includes('gnome-accent.js'));
});
