const test = require('node:test');
const assert = require('node:assert/strict');
const Dialogs = require('../src/dialogs.js');

test('abre e fecha diálogos restaurando o foco anterior', () => {
  const trigger = { focused: false, focus() { this.focused = true; } };
  const initialFocus = { focused: false, focus() { this.focused = true; } };
  const classList = {
    values: new Set(),
    add(value) { this.values.add(value); },
    remove(value) { this.values.delete(value); }
  };
  const documentRef = {
    activeElement: trigger,
    body: { classList }
  };
  const appMenu = {
    hidden: true,
    querySelectorAll() { return []; }
  };
  const appMenuButton = { setAttribute() {}, focus() {} };
  const dialog = {
    hidden: true,
    querySelector(selector) {
      return selector === '[data-dialog-initial-focus]' ? initialFocus : null;
    }
  };
  let closedDialog = null;
  const controller = Dialogs.createDialogController({
    document: documentRef,
    appMenu,
    appMenuButton,
    onClose(dialogElement) { closedDialog = dialogElement; }
  });

  controller.open(dialog);
  assert.equal(dialog.hidden, false);
  assert.equal(classList.values.has('modal-open'), true);
  assert.equal(initialFocus.focused, true);

  controller.close(dialog);
  assert.equal(dialog.hidden, true);
  assert.equal(classList.values.has('modal-open'), false);
  assert.equal(trigger.focused, true);
  assert.equal(closedDialog, dialog);
});
