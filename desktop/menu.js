'use strict';

function createApplicationMenuTemplate(options) {
  var onAction = options.onAction;
  var onQuit = options.onQuit;

  function action(label, accelerator, name) {
    return {
      label: label,
      accelerator: accelerator,
      click: function () { onAction(name); }
    };
  }

  return [
    {
      label: 'Arquivo',
      submenu: [
        action('Adicionar boletos…', 'CommandOrControl+O', 'open-files'),
        action('Adicionar valor avulso…', undefined, 'add-manual'),
        { type: 'separator' },
        { label: 'Sair', role: 'quit', click: onQuit }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        action('Manual', 'F1', 'manual'),
        action('Sobre o Somador de Contas', undefined, 'about')
      ]
    }
  ];
}

module.exports = { createApplicationMenuTemplate };
