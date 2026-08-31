/*
 * Define os dois canais de distribuição do aplicativo. O valor é fechado em
 * "stable" por padrão: qualquer metadado ausente ou inválido nunca pode fazer
 * uma versão estável se apresentar como uma versão de testes.
 */
function normalizeBuildChannel(value) {
  return value === 'test' ? 'test' : 'stable';
}

const BUILD_IDENTITIES = Object.freeze({
  stable: Object.freeze({
    appId: 'br.com.victorferreirafranco.budget',
    desktopName: 'br.com.victorferreirafranco.budget',
    iconFile: 'icon.png',
    productName: 'Budget',
    executableName: 'budget'
  }),
  test: Object.freeze({
    appId: 'br.com.victorferreirafranco.budget.test',
    desktopName: 'br.com.victorferreirafranco.budget.test',
    iconFile: 'icon-test.png',
    productName: 'Budget Test',
    executableName: 'budget-test'
  })
});

function getBuildIdentity(channel) {
  return BUILD_IDENTITIES[normalizeBuildChannel(channel)];
}

function getBuildChannel({ isPackaged, environment, packageInfo }) {
  if (!isPackaged) return normalizeBuildChannel(environment && environment.BUDGET_BUILD_CHANNEL);
  return normalizeBuildChannel(packageInfo && packageInfo.budgetBuildChannel);
}

module.exports = {
  getBuildChannel,
  getBuildIdentity,
  normalizeBuildChannel
};
