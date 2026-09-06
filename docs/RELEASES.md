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
   Quando uma nova versão de teste passa por todos os jobs, a própria CI cria
   a tag, a pré-release e chama o workflow `Publicar AppImage`.

## Pré-release

Use uma versão SemVer inédita de pré-release, como `6.0.0-test.1`, em todos os
arquivos de versão. Integre a mudança por pull request na branch `test`. Após
os testes passarem, a CI executa automaticamente e nesta ordem:

1. confirma que a versão e os HTMLs gerados estão sincronizados;
2. cria uma tag anotada no commit validado;
3. cria a release marcada como **Pre-release** e apontada para `test`;
4. chama o workflow `Publicar AppImage` para as duas arquiteturas;
5. valida os arquivos reais anexados à release.

Não crie manualmente a tag nem a pré-release no fluxo normal. Se uma tag da
mesma versão já apontar para outro commit, a publicação falha de forma
explícita: incremente o número `test.N` no pull request. Mudanças somente em
documentação ou na própria CI não geram um AppImage duplicado.

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
com o canal de testes. Depois do upload, cada job consulta somente os assets
da arquitetura sob sua responsabilidade. Isso evita uma condição de corrida
durante os uploads paralelos e ainda falha se faltar algum par
AppImage/`.zsync` necessário ao Gear Lever.

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
GitHub. Confira se ela contém apenas os commits esperados, espere as
validações obrigatórias e escolha **Rebase and merge** (ou outro método linear
equivalente disponível no repositório). A proteção de branch impede o push
direto para `main`.

Crie então uma tag estável com a mesma versão distribuída e publique uma
release sem a marca **Pre-release**. Pelo GitHub, abra **Releases → Draft a
new release**, informe uma tag nova como `v6.0.0`, mantenha `main` como alvo e
clique em **Publish release**. O GitHub cria a tag apontando para o commit de
`main` ao publicar a release.

Como alternativa, a tag pode ser criada e enviada pelo terminal antes de abrir
a página de releases:

```sh
git tag -a v6.0.0 -m "Release 6.0.0"
git push origin v6.0.0
```

O workflow de release só deve ser considerado concluído quando todos os
arquivos acima estiverem anexados, houver uma atestação para cada AppImage e
cada arquitetura puder ser verificada com `sha256sum`.

O workflow aceita uma release estável somente quando a tag aponta para `main`,
com uma versão sem sufixo de pré-release. Antes de gerar qualquer AppImage, ele
exige uma pré-release completa `vX.Y.Z-test.N`, publicada a partir de `test`,
com os pares x86_64 e aarch64. Também compara o código distribuído e recusa a
promoção se ele não for o mesmo que foi testado; somente os arquivos de versão
e os HTMLs gerados podem mudar. Depois do upload, valida os nomes fixos do canal
estável e os pares de compatibilidade usados pelo Gear Lever para migrar
instalações 6.1.3 e 6.1.4.

AppImages estáveis não recebem a marca **TESTE** e continuam apontando para o
canal `latest`. Cada release também anexa um par de arquivos de nome fixo,
`Budget-x86_64.AppImage`/`.zsync` e `Budget-aarch64.AppImage`/`.zsync`, usado
exclusivamente como origem de atualização. Os arquivos versionados continuam
disponíveis para download manual. Essa referência fixa permite ao Gear Lever
encontrar a versão mais recente mesmo que o nome do AppImage distribuído mude.
Assim, a promoção do código para `main` remove a identificação de
desenvolvimento automaticamente no próximo build estável.

## Correção de emergência

Para corrigir uma versão já estável, faça a correção primeiro em `test`, rode
toda a validação e promova a alteração para `main`. Não altere nem mova uma tag
de release já publicada: crie uma nova versão de patch, como `6.0.1`.
