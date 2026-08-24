const test = require('node:test');
const assert = require('node:assert/strict');
const UiLayout = require('../src/ui-layout.js');

function createHost() {
  return {
    hidden: false,
    children: [],
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
    }
  };
}

test('move a única ação de valor avulso entre os estados vazio e preenchido', () => {
  const statusActions = createHost();
  const manualActionHost = createHost();
  const addManualBtn = { parentElement: statusActions };
  const elements = {
    statusPage: { hidden: false },
    statusActions,
    boxedList: { hidden: true },
    summaryCard: { hidden: true },
    menuClear: { disabled: true },
    manualActionHost,
    addManualBtn
  };

  UiLayout.syncItemLayout(elements, 0);
  assert.equal(elements.statusPage.hidden, false);
  assert.equal(elements.boxedList.hidden, true);
  assert.equal(manualActionHost.hidden, true);
  assert.equal(addManualBtn.parentElement, statusActions);

  UiLayout.syncItemLayout(elements, 1);
  assert.equal(elements.statusPage.hidden, true);
  assert.equal(elements.boxedList.hidden, false);
  assert.equal(elements.summaryCard.hidden, false);
  assert.equal(elements.menuClear.disabled, false);
  assert.equal(manualActionHost.hidden, false);
  assert.equal(addManualBtn.parentElement, manualActionHost);
});
