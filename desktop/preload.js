const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('somadorDesktop', {
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  onAppAction: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const listener = (_event, action) => handler(action);
    ipcRenderer.on('somador:action', listener);
    return () => ipcRenderer.removeListener('somador:action', listener);
  }
});
