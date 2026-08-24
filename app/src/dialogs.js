(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SomadorDialogs = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createDialogController(options) {
    var activeDialog = null;
    var lastFocusedElement = null;
    var documentRef = options.document;

    function getMenuItems() {
      return Array.prototype.filter.call(options.appMenu.querySelectorAll('.menu-item'), function (item) {
        return !item.disabled;
      });
    }

    function setMenuOpen(open, restoreFocus) {
      var wasOpen = !options.appMenu.hidden;
      options.appMenu.hidden = !open;
      options.appMenuButton.setAttribute('aria-expanded', String(open));
      if (open) {
        var firstItem = getMenuItems()[0];
        if (firstItem) firstItem.focus();
      } else if (restoreFocus && wasOpen) {
        options.appMenuButton.focus();
      }
    }

    function open(dialog) {
      setMenuOpen(false);
      lastFocusedElement = documentRef.activeElement;
      activeDialog = dialog;
      dialog.hidden = false;
      documentRef.body.classList.add('modal-open');
      var initialFocus = dialog.querySelector('[data-dialog-initial-focus]') || dialog.querySelector('[data-dialog-close]');
      if (initialFocus) initialFocus.focus();
    }

    function close(dialog) {
      if (!dialog || dialog.hidden) return;
      dialog.hidden = true;
      activeDialog = null;
      documentRef.body.classList.remove('modal-open');
      if (typeof options.onClose === 'function') options.onClose(dialog);
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
    }

    function keepFocusInsideActiveDialog(event) {
      if (!activeDialog) return;
      var focusable = Array.prototype.filter.call(
        activeDialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'),
        function (element) { return !element.hidden && element.getClientRects().length > 0; }
      );
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    return Object.freeze({
      close: close,
      getActiveDialog: function () { return activeDialog; },
      getMenuItems: getMenuItems,
      keepFocusInsideActiveDialog: keepFocusInsideActiveDialog,
      open: open,
      setMenuOpen: setMenuOpen
    });
  }

  return Object.freeze({ createDialogController: createDialogController });
});
