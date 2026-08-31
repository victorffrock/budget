const { contextBridge, ipcRenderer } = require('electron');

let latestGnomeAccent = null;
const gnomeAccentListeners = new Set();
let latestBuildIcon = null;
const buildIconListeners = new Set();
// O argumento adicionado pelo processo principal é anexado ao fim da lista.
// Ler de trás para frente impede que uma flag digitada ao iniciar o AppImage
// se sobreponha ao canal definido pelo pacote assinado.
const buildChannelArgument = [...process.argv].reverse()
  .find((argument) => argument.startsWith('--budget-build-channel='));
const buildChannel = buildChannelArgument === '--budget-build-channel=test' ? 'test' : 'stable';

ipcRenderer.on('budget:gnome-accent', (_event, accent) => {
  latestGnomeAccent = accent;
  gnomeAccentListeners.forEach((listener) => listener(accent));
});

ipcRenderer.on('budget:build-icon', (_event, iconDataUri) => {
  if (typeof iconDataUri !== 'string' || !iconDataUri.startsWith('data:image/png;base64,')) return;
  latestBuildIcon = iconDataUri;
  buildIconListeners.forEach((listener) => listener(iconDataUri));
});

contextBridge.exposeInMainWorld('budgetDesktop', {
  isDesktop: true,
  buildChannel,
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  onAppAction: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const listener = (_event, action) => handler(action);
    ipcRenderer.on('budget:action', listener);
    return () => ipcRenderer.removeListener('budget:action', listener);
  },
  onGnomeAccentChanged: (handler) => {
    if (typeof handler !== 'function') return () => {};
    gnomeAccentListeners.add(handler);
    if (latestGnomeAccent) queueMicrotask(() => handler(latestGnomeAccent));
    return () => gnomeAccentListeners.delete(handler);
  },
  onBuildIconChanged: (handler) => {
    if (typeof handler !== 'function') return () => {};
    buildIconListeners.add(handler);
    if (latestBuildIcon) queueMicrotask(() => handler(latestBuildIcon));
    return () => buildIconListeners.delete(handler);
  }
});
