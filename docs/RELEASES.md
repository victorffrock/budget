# Publicação de versões

Este documento descreve como uma alteração passa pela validação até se tornar
uma release estável do Budget. Ele existe para que o AppImage, o
site e o código-fonte publiquem exatamente a mesma versão.

## Branches

O repositório mantém duas branches permanentes:

| Branch | Finalidade |
| --- | --- |
| `test` | integração, testes e pré-releases |
| `main` | código da versão estável |

Branches de trabalho podem ser criadas a partir de `test`. Quando a pull request
é mesclada no GitHub, a branch de origem é removida automaticamente; isso não
se aplica a pull requests fechadas sem mesclagem, cujas branches podem ser
removidas manualmente. As branches permanentes são protegidas. Use uma pull
request para integrar mudanças em `test` ou promover `test` para `main`.
A integração exige que as validações obrigatórias estejam aprovadas. Não publique uma versão
estável diretamente a partir de uma branch de trabalho.

O contrato da CI compara a árvore completa de qualquer pull request destinada
a `main` com a ponta atual de `test`. Portanto, nenhuma mudança — nem mesmo de
documentação ou automação — pode estrear diretamente na branch estável.

## Antes de criar uma release

1. Confirme que `app/package.json` e `desktop/package.json` usam a mesma
   versão. O comando abaixo também verifica essa regra:

   ```sh
   node scripts/verify-release-version.cjs
   ```

2. Gere o HTML offline e execute a suíte local:

   ```sh
   cd app
   npm ci
   npm test
   npm run build
   npm run verify

   cd ../desktop
   npm ci
   npm test
   npm run test:ui
   ```

3. Envie as alterações para `test` e espere a conclusão bem-sucedida de todos
   os jobs de CI e CodeQL no GitHub. A CI também valida os SBOMs e o AppImage.

   A CI geral é executada em pushes para `main` e `test` e em pull requests.
   Quando uma nova versão de teste passa por todos os jobs, incluindo o CodeQL
   ligado diretamente à publicação, a própria CI cria a tag, prepara uma
   pré-release em rascunho e chama o workflow `Publicar AppImage`.

## Pré-release

Use uma versão SemVer inédita de pré-release, como `6.0.0-test.1`, em todos os
arquivos de versão. Integre a mudança por pull request na branch `test`. Após
os testes passarem, a CI executa automaticamente e nesta ordem:

1. confirma que a versão e os HTMLs gerados estão sincronizados;
2. cria uma tag anotada no commit validado;
3. cria um rascunho marcado como **Pre-release** e apontado para `test`;
4. chama o workflow `Publicar AppImage` para as duas arquiteturas;
5. valida juntos os arquivos reais das duas arquiteturas;
6. somente então torna a pré-release visível ao GitHub e ao Gear Lever.

Não crie manualmente a tag nem a pré-release. Se uma tag da
mesma versão já apontar para outro commit, a publicação falha de forma
explícita: incremente o número `test.N` no pull request. Mudanças somente em
documentação não geram um AppImage duplicado. Mudanças na CI de publicação são
consideradas distribuídas e exigem uma nova pré-release para que o processo
seja exercitado de ponta a ponta.
Tags de versão no padrão `v*` são protegidas contra movimentação e exclusão.
Uma versão publicada é imutável; qualquer correção recebe outra versão.

O workflow anexa automaticamente:

- os AppImages `Budget-test-x86_64.AppImage` e
  `Budget-test-aarch64.AppImage`, ambos identificados visualmente como
  **TESTE**;
- um arquivo `.zsync` para cada arquitetura;
- `SHA256SUMS-x86_64.txt` e `SHA256SUMS-aarch64.txt`;
- SBOMs separados para cada arquitetura.

O mesmo workflow registra no GitHub uma atestação de procedência para o
AppImage. A atestação não é um arquivo anexado à release: ela pode ser
consultada com `gh attestation verify`.

Baixe o AppImage da pré-release e teste o fluxo que mudou antes de promover a
versão.

O workflow valida que a tag, a versão e a branch de destino são compatíveis
com o canal de testes. Durante o upload, cada job consulta somente os assets
da arquitetura sob sua responsabilidade, evitando condições de corrida. Um
job final confere novamente os dois pares AppImage/`.zsync` no mesmo rascunho.
Se qualquer etapa falhar, o rascunho continua invisível e a versão anterior
permanece como origem válida para o Gear Lever.

Além dos arquivos da pré-release versionada, o workflow atualiza a pré-release
contínua de tag `test`, que serve como endereço fixo para download manual. O
Gear Lever recebe no AppImage a origem `latest-pre`: ela consulta as
pré-releases publicadas e seleciona o arquivo `Budget-test` mais recente.
Depois de integrar uma versão de teste uma única vez, ela passa a receber
somente novas pré-releases; ela não atualiza nem substitui uma instalação
estável. O AppImage de teste usa um identificador `.desktop` e ícone próprios,
portanto pode coexistir com o Budget estável. Não edite nem apague manualmente
a release de tag `test`.

## Versão estável

Depois de aprovar uma pré-release, prepare em `test` o commit final que troca
somente a identificação de pré-release pela versão estável. Atualize todas as
fontes de versão, gere novamente o HTML offline, execute a validação de versão
e espere a CI passar. Assim, por exemplo, `6.0.0-test.1` se torna `6.0.0` antes
da publicação.

Promova então esse commit final de `test` para `main` por uma pull request no
GitHub. A CI exige que a árvore completa da pull request seja idêntica à ponta
atual de `test`. Espere as validações obrigatórias e escolha **Rebase and
merge**. A proteção de branch impede o push direto e mantém o histórico linear.

Depois da integração, abra **Actions → Promover release estável → Run
workflow**, informe a versão sem `v` — por exemplo, `6.2.0` — e confirme. Esse
é o único caminho normal de publicação estável. O workflow sempre lê `main`,
exige a pré-release aprovada, cria a tag e mantém a release em rascunho enquanto
as duas arquiteturas são construídas. A release só se torna pública depois da
validação conjunta.

Uma release publicada manualmente pela interface é removida automaticamente:
ela poderia ficar incompleta e ser selecionada pelo Gear Lever antes do fim da
compilação. A tag não é reutilizada; corrija a causa e incremente a versão.

O workflow de promoção só é concluído quando todos os arquivos obrigatórios
estão anexados, há uma atestação para cada AppImage e cada arquitetura passou
pelo contrato de atualização. Até esse momento, a release permanece em
rascunho.

O workflow aceita uma release estável somente quando a tag aponta para `main`,
com uma versão sem sufixo de pré-release. Antes de gerar qualquer AppImage, ele
exige uma pré-release completa `vX.Y.Z-test.N`, publicada a partir de `test`,
com os pares x86_64 e aarch64. Também compara o código distribuído e recusa a
promoção se ele não for o mesmo que foi testado; somente os arquivos de versão
e os HTMLs gerados podem mudar. Depois do upload, valida os nomes fixos do canal
estável e recusa qualquer segunda identidade da mesma arquitetura.

AppImages estáveis não recebem a marca **TESTE** e continuam apontando para o
canal `latest`. Cada release contém exatamente um AppImage e um `.zsync` por
arquitetura: `Budget-x86_64.AppImage`/`.zsync` e
`Budget-aarch64.AppImage`/`.zsync`. Esses mesmos arquivos atendem ao download
manual e ao Gear Lever. O contrato automatizado recusa aliases legados,
arquivos versionados duplicados, um `.zsync` sem o AppImage correspondente ou
qualquer segunda identidade da mesma arquitetura. A versão permanece
registrada na tag, no título da release e dentro do aplicativo. Assim, a
promoção para `main` remove a identificação de desenvolvimento automaticamente
no build estável sem multiplicar artefatos.

## Correção de emergência

Para corrigir uma versão já estável, faça a correção primeiro em `test`, rode
toda a validação e promova a alteração para `main`. Não altere nem mova uma tag
de release já publicada: crie uma nova versão de patch, como `6.0.1`.
