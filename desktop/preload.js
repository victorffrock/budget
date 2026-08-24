const { contextBridge, ipcRenderer } = require('electron');

let latestGnomeAccent = null;
const gnomeAccentListeners = new Set();

ipcRenderer.on('budget:gnome-accent', (_event, accent) => {
  latestGnomeAccent = accent;
  gnomeAccentListeners.forEach((listener) => listener(accent));
});

contextBridge.exposeInMainWorld('budgetDesktop', {
  isDesktop: true,
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
  }
});
