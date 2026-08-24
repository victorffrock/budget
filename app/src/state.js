(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SomadorState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Estado e regras de coleção ficam fora da camada de interface para que
  // possam ser testados sem depender do DOM, do Electron ou do PDF.js.
  function createAppState() {
    return { items: [], availableAmount: null };
  }

  function createManualItem(id, description, amount) {
    return {
      id: id,
      kind: 'manual',
      filename: description,
      amount: amount,
      due: null,
      status: 'ok',
      confidence: 'manual',
      cancelled: false
    };
  }

  function createPendingPdfItem(id, filename) {
    return {
      id: id,
      filename: filename,
      amount: null,
      due: null,
      status: 'processing',
      confidence: 'err',
      cancelled: false,
      ocrUsed: false,
      ocrTried: false,
      ocrSkipped: false,
      ocrError: false,
      ocrPage: 0,
      ocrPages: 0,
      ocrProgress: 0
    };
  }

  function appendItems(state, items) {
    state.items = state.items.concat(items);
    return state.items;
  }

  function findItem(state, id) {
    return state.items.find(function (item) { return item.id === id; });
  }

  function containsItem(state, item) {
    return state.items.indexOf(item) !== -1;
  }

  function removeItem(state, item) {
    state.items = state.items.filter(function (candidate) { return candidate !== item; });
    return state.items;
  }

  function clearItems(state) {
    var previousItems = state.items;
    state.items = [];
    return previousItems;
  }

  function setAvailableAmount(state, amount) {
    state.availableAmount = amount;
  }

  function calculateTotal(items) {
    return items.reduce(function (sum, item) {
      return sum + (typeof item.amount === 'number' ? item.amount : 0);
    }, 0);
  }

  function getItemCounts(items) {
    var documentCount = items.filter(function (item) { return item.kind !== 'manual'; }).length;
    return {
      documentCount: documentCount,
      manualCount: items.length - documentCount
    };
  }

  return Object.freeze({
    appendItems: appendItems,
    calculateTotal: calculateTotal,
    clearItems: clearItems,
    containsItem: containsItem,
    createAppState: createAppState,
    createManualItem: createManualItem,
    createPendingPdfItem: createPendingPdfItem,
    findItem: findItem,
    getItemCounts: getItemCounts,
    removeItem: removeItem,
    setAvailableAmount: setAvailableAmount
  });
});
