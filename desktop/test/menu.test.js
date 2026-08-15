const test = require('node:test');
const assert = require('node:assert/strict');
const { createApplicationMenuTemplate } = require('../menu.js');

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
  assert.equal(helpItems[0].accelerator, 'F1');

  fileItems[0].click();
  helpItems[0].click();
  helpItems[1].click();
  fileItems[2].click();
  assert.deepEqual(actions, ['open-files', 'manual', 'about', 'quit']);
});
