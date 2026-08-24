/*
 * Exercita a interface real dentro do Electron, sem depender de serviços
 * externos. Este teste protege os fluxos que já sofreram regressões: ação
 * de valor avulso, saldo, rolagem com muitos itens e retorno ao estado vazio.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

app.commandLine.appendSwitch('disable-gpu');

function execute(window, source) {
  return window.webContents.executeJavaScript(source, true);
}

function addManualValue(window, description, amount) {
  return execute(window, `
    (() => {
      document.getElementById('addManualBtn').click();
      document.getElementById('manualValueDescription').value = ${JSON.stringify(description)};
      document.getElementById('manualValueInput').value = ${JSON.stringify(amount)};
      document.getElementById('manualValueForm').requestSubmit();
      return {
        statusHidden: document.getElementById('statusPage').hidden,
        manualActionHidden: document.getElementById('manualActionHost').hidden,
        manualActionParent: document.getElementById('addManualBtn').parentElement.id,
        total: document.getElementById('totalValue').textContent
      };
    })()
  `);
}

async function waitForApp(window) {
  await execute(window, `
    new Promise((resolve, reject) => {
      if (document.body.dataset.budgetReady === 'true') return resolve();
      const timeout = window.setTimeout(() => reject(new Error('O aplicativo não concluiu a inicialização.')), 10000);
      window.addEventListener('budget-ready', () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    })
  `);
}

async function run() {
  await app.whenReady();
  const window = new BrowserWindow({
    width: 480,
    height: 780,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, '..', 'preload.js')
    }
  });

  try {
    await window.loadFile(path.join(__dirname, '..', 'index.html'), { query: { e2e: '1' } });
    await waitForApp(window);

    const initialState = await execute(window, `({
      statusHidden: document.getElementById('statusPage').hidden,
      manualActionParent: document.getElementById('addManualBtn').parentElement.id,
      manualActionHostHidden: document.getElementById('manualActionHost').hidden
    })`);
    assert.deepEqual(initialState, {
      statusHidden: false,
      manualActionParent: 'statusActions',
      manualActionHostHidden: true
    });

    const firstItem = await addManualValue(window, 'Conta de teste', '100,00');
    assert.equal(firstItem.statusHidden, true);
    assert.equal(firstItem.manualActionHidden, false);
    assert.equal(firstItem.manualActionParent, 'manualActionHost');
    assert.equal(firstItem.total, '100,00');

    const balanceResult = await execute(window, `
      (() => {
        const input = document.getElementById('availableAmountInput');
        input.value = '250,00';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return document.getElementById('balanceResult').textContent.replace(/\\s+/g, ' ').trim();
      })()
    `);
    assert.match(balanceResult, /Sobra após pagar as contas R\$ 150,00/);

    for (let index = 0; index < 16; index += 1) {
      await addManualValue(window, 'Item ' + index, '10,00');
    }

    const scrollingState = await execute(window, `
      new Promise((resolve) => {
        const header = document.querySelector('.headerbar');
        const before = header.getBoundingClientRect().top;
        window.scrollTo(0, document.documentElement.scrollHeight);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve({
          headerAfter: header.getBoundingClientRect().top,
          headerPosition: getComputedStyle(header).position,
          rowCount: document.querySelectorAll('#rows .list-row').length,
          scrollable: document.documentElement.scrollHeight > window.innerHeight
        })));
      })
    `);
    assert.equal(scrollingState.headerPosition, 'sticky');
    assert.equal(scrollingState.scrollable, true);
    assert.equal(scrollingState.rowCount, 17);
    assert.ok(Math.abs(scrollingState.headerAfter) <= 1, 'o cabeçalho deve permanecer no topo ao rolar');

    const clearedState = await execute(window, `
      (() => {
        document.getElementById('clearBtn').click();
        return {
          statusHidden: document.getElementById('statusPage').hidden,
          listHidden: document.getElementById('boxedList').hidden,
          manualActionHostHidden: document.getElementById('manualActionHost').hidden,
          manualActionParent: document.getElementById('addManualBtn').parentElement.id
        };
      })()
    `);
    assert.deepEqual(clearedState, {
      statusHidden: false,
      listHidden: true,
      manualActionHostHidden: true,
      manualActionParent: 'statusActions'
    });

    console.log('Fluxos da interface Electron validados.');
    // Dá tempo para o processo principal descarregar o resultado antes de
    // encerrar o Electron, principalmente em execução sem janela visível.
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    window.destroy();
    app.quit();
  }
}

run().catch((error) => {
  console.error(error.stack || error);
  app.exit(1);
});
