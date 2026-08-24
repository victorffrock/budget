(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BudgetUiLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function setHidden(element, hidden) {
    element.hidden = hidden;
  }

  // Há apenas um botão de valor avulso. Em vez de duplicá-lo, ele é movido
  // entre os dois contêineres que representam os estados vazio e preenchido.
  function syncManualActionPosition(elements, hasItems) {
    var target = hasItems ? elements.manualActionHost : elements.statusActions;
    if (elements.addManualBtn.parentElement !== target) {
      target.appendChild(elements.addManualBtn);
    }
    setHidden(elements.manualActionHost, !hasItems);
  }

  // Mantém os elementos dependentes da quantidade de itens sincronizados.
  // A camada de renderização delega esta decisão para evitar estados visuais
  // divergentes, como lista visível com a tela vazia ainda ocupando espaço.
  function syncItemLayout(elements, itemCount) {
    var hasItems = itemCount > 0;
    setHidden(elements.statusPage, hasItems);
    setHidden(elements.boxedList, !hasItems);
    setHidden(elements.summaryCard, !hasItems);
    elements.menuClear.disabled = !hasItems;
    syncManualActionPosition(elements, hasItems);
  }

  return Object.freeze({
    setHidden: setHidden,
    syncItemLayout: syncItemLayout,
    syncManualActionPosition: syncManualActionPosition
  });
});
