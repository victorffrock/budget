const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('budgetDesktop', {
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  onAppAction: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const listener = (_event, action) => handler(action);
    ipcRenderer.on('budget:action', listener);
    return () => ipcRenderer.removeListener('budget:action', listener);
  }
});
