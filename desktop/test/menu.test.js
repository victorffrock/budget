const test = require('node:test');
const assert = require('node:assert/strict');
const { createApplicationMenuTemplate } = require('../menu.js');
const desktopPackage = require('../package.json');

test('oferece ações de arquivo e ajuda no menu nativo', () => {
  const actions = [];
  const template = createApplicationMenuTemplate({
    onAction: (action) => actions.push(action),
    onQuit: () => actions.push('quit')
  });

  assert.deepEqual(template.map((item) => item.label), ['Arquivo', 'Ajuda']);

  const fileItems = template[0].submenu;
  const helpItems = template[1].submenu;
  assert.equal(fileItems[0].accelerator, 'CommandOrControl+O');
  assert.equal(fileItems[1].label, 'Adicionar valor avulso…');
  assert.equal(helpItems[0].accelerator, 'F1');

  fileItems[0].click();
  fileItems[1].click();
  helpItems[0].click();
  helpItems[1].click();
  fileItems[3].click();
  assert.deepEqual(actions, ['open-files', 'add-manual', 'manual', 'about', 'quit']);
});

test('mantém a permissão de instalação do Electron na versão empacotada', () => {
  assert.equal(desktopPackage.allowScripts['electron@' + desktopPackage.devDependencies.electron], true);
  assert.ok(desktopPackage.build.files.includes('navigation.js'));
});
