/*
 * O renderer do Budget só deve exibir conteúdo local. Links de ajuda podem
 * abrir o navegador padrão, mas nunca uma nova janela Electron nem um esquema
 * de URL arbitrário. Manter a regra pura torna-a verificável sem iniciar o
 * Electron.
 */
function isSafeExternalUrl(rawUrl) {
  try {
    return new URL(rawUrl).protocol === 'https:';
  } catch (_error) {
    return false;
  }
}

function openExternalIfSafe(shell, rawUrl) {
  if (!isSafeExternalUrl(rawUrl)) return false;

  try {
    const result = shell.openExternal(rawUrl);
    // Electron retorna uma Promise; o mock de testes pode não retornar nada.
    if (result && typeof result.catch === 'function') result.catch(() => {});
    return true;
  } catch (_error) {
    return false;
  }
}

function installNavigationGuard(webContents, shell) {
  webContents.setWindowOpenHandler(({ url }) => {
    openExternalIfSafe(shell, url);
    return { action: 'deny' };
  });
  webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    openExternalIfSafe(shell, url);
  });
}

module.exports = {
  isSafeExternalUrl,
  openExternalIfSafe,
  installNavigationGuard
};
