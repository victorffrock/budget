const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { createApplicationMenuTemplate } = require('./menu');
const { createGnomeAccentService } = require('./gnome-accent');
const { getBuildChannel, getBuildIdentity } = require('./build-channel');

let gnomeAccentService = null;

function getPackagedMetadata() {
  try {
    return require(path.join(app.getAppPath(), 'package.json'));
  } catch (_error) {
    return {};
  }
}

function getCurrentBuildChannel() {
  return getBuildChannel({
    isPackaged: app.isPackaged,
    environment: process.env,
    packageInfo: app.isPackaged ? getPackagedMetadata() : null
  });
}

function getCurrentBuildIdentity() {
  return getBuildIdentity(getCurrentBuildChannel());
}

function getBuildIconDataUri(identity) {
  if (identity.iconFile === 'icon.png') return null;
  try {
    const iconPath = path.join(__dirname, 'assets', identity.iconFile);
    return `data:image/png;base64,${fs.readFileSync(iconPath).toString('base64')}`;
  } catch (_error) {
    // O ícone estável já vem embutido no HTML. Se o recurso opcional de teste
    // não estiver disponível, a interface continua utilizável e identificada.
    return null;
  }
}

function sendAppAction(action) {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('budget:action', action);
}

function installApplicationMenu() {
  const menu = Menu.buildFromTemplate(createApplicationMenuTemplate({
    onAction: sendAppAction,
    onQuit: () => app.quit()
  }));
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const buildChannel = getCurrentBuildChannel();
  const buildIdentity = getCurrentBuildIdentity();
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
    icon: path.join(__dirname, 'assets', buildIdentity.iconFile),
    title: 'Budget',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath,
      // O renderer recebe somente este valor validado; nunca dados de ambiente
      // ou metadados completos do pacote.
      additionalArguments: [`--budget-build-channel=${buildChannel}`]
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // O preload armazena a última cor recebida. Assim, mesmo que a interface
  // ainda esteja carregando o PDF.js, ela recebe a preferência ao registrar o
  // listener no renderer.
  win.webContents.once('did-finish-load', () => {
    const accent = gnomeAccentService && gnomeAccentService.getAccent();
    if (accent && !win.isDestroyed()) win.webContents.send('budget:gnome-accent', accent);
    const buildIcon = getBuildIconDataUri(buildIdentity);
    if (buildIcon && !win.isDestroyed()) win.webContents.send('budget:build-icon', buildIcon);
  });

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
  gnomeAccentService = createGnomeAccentService({
    onAccentChange: (accent) => {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) win.webContents.send('budget:gnome-accent', accent);
      });
    }
  });
  gnomeAccentService.start();
  installApplicationMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (gnomeAccentService) gnomeAccentService.stop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
