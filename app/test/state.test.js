const test = require('node:test');
const assert = require('node:assert/strict');
const State = require('../src/state.js');

test('mantém totais e contagens fora da camada visual', () => {
  const state = State.createAppState();
  State.appendItems(state, [
    State.createPendingPdfItem(1, 'boleto.pdf'),
    State.createManualItem(2, 'Mercado', 45.5)
  ]);
  state.items[0].amount = 120;

  assert.equal(State.calculateTotal(state.items), 165.5);
  assert.deepEqual(State.getItemCounts(state.items), { documentCount: 1, manualCount: 1 });
  assert.equal(State.findItem(state, 2).filename, 'Mercado');
  assert.equal(State.containsItem(state, state.items[0]), true);
});

test('remove e limpa itens sem reter referências no estado', () => {
  const state = State.createAppState();
  const first = State.createManualItem(1, 'A', 10);
  const second = State.createManualItem(2, 'B', 20);
  State.appendItems(state, [first, second]);

  State.removeItem(state, first);
  assert.deepEqual(state.items, [second]);

  const previousItems = State.clearItems(state);
  assert.deepEqual(previousItems, [second]);
  assert.deepEqual(state.items, []);
});

test('guarda o dinheiro disponível no estado da aplicação', () => {
  const state = State.createAppState();
  State.setAvailableAmount(state, 123.45);
  assert.equal(state.availableAmount, 123.45);
});
