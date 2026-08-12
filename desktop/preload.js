const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('somadorDesktop', {
  isDesktop: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close')
});
