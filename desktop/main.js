const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

Menu.setApplicationMenu(null);

function createWindow() {
  const preloadPath = app.isPackaged
    ? path.join(process.resourcesPath, 'preload.js')
    : path.join(__dirname, 'preload.js');

  const win = new BrowserWindow({
    width: 480,
    height: 780,
    minWidth: 360,
    minHeight: 520,
    backgroundColor: '#f6f5f4',
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Somador de Contas',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.once('ready-to-show', () => win.show());
}

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
