/*
 * Define os dois canais de distribuição do aplicativo. O valor é fechado em
 * "stable" por padrão: qualquer metadado ausente ou inválido nunca pode fazer
 * uma versão estável se apresentar como uma versão de testes.
 */
function normalizeBuildChannel(value) {
  return value === 'test' ? 'test' : 'stable';
}

function getBuildChannel({ isPackaged, environment, packageInfo }) {
  if (!isPackaged) return normalizeBuildChannel(environment && environment.BUDGET_BUILD_CHANNEL);
  return normalizeBuildChannel(packageInfo && packageInfo.budgetBuildChannel);
}

module.exports = {
  getBuildChannel,
  normalizeBuildChannel
};
