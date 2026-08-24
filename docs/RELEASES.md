# Publicação de versões

Este documento descreve como uma alteração passa pela validação até se tornar
uma release estável do Budget. Ele existe para que o AppImage, o APK Android,
o site e o código-fonte publiquem exatamente a mesma versão.

## Branches

O repositório mantém duas branches permanentes:

| Branch | Finalidade |
| --- | --- |
| `test` | integração, testes e pré-releases |
| `main` | código da versão estável |

Branches de trabalho podem ser criadas a partir de `test` e removidas depois da
mesclagem. Não publique uma versão estável diretamente a partir de uma branch
de trabalho.

## Antes de criar uma release

1. Confirme que `app/package.json`, `desktop/package.json` e
   `mobile/package.json` usam a mesma versão. O comando abaixo também verifica
   essa regra:

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

   cd ../mobile
   npm ci
   npm test
   npm run sync
   npm run verify
   ```

3. Envie as alterações para `test` e espere a conclusão bem-sucedida de todos
   os jobs de CI e CodeQL no GitHub. A CI também valida os SBOMs e o AppImage.

## Pré-release

Use uma versão SemVer de pré-release, como `6.0.0-test.1`, em todos os arquivos
de versão. Depois dos testes, crie e envie uma tag anotada:

```sh
git tag -a v6.0.0-test.1 -m "Pré-release 6.0.0-test.1"
git push origin v6.0.0-test.1
```

No GitHub, crie a release para essa tag, marque **Pre-release** e publique. O
workflow `Publicar AppImage` anexa automaticamente:

- o AppImage;
- o arquivo `.zsync` usado pelo Gear Lever;
- `SHA256SUMS.txt`;
- `SBOM-app.cdx.json` e `SBOM-desktop.cdx.json`.

Quando os secrets de assinatura Android estiverem configurados, a mesma release
também anexa:

- `Budget-<versão>-universal.apk`, rastreável pelo Obtainium;
- `SHA256SUMS-Android.txt`;
- `SBOM-mobile.cdx.json`.

O mesmo workflow registra no GitHub uma atestação de procedência para o
AppImage. A atestação não é um arquivo anexado à release: ela pode ser
consultada com `gh attestation verify`.

Baixe o AppImage da pré-release e teste o fluxo que mudou antes de promover a
versão.

## Versão estável

Depois de aprovar uma pré-release, prepare em `test` o commit final que troca
somente a identificação de pré-release pela versão estável. Atualize todas as
fontes de versão, gere novamente o HTML offline, execute a validação de versão
e espere a CI passar. Assim, por exemplo, `6.0.0-test.1` se torna `6.0.0` antes
da publicação.

Promova então esse commit final de `test` para `main`. Prefira o avanço rápido
para evitar que outra alteração entre junto por acidente:

```sh
git checkout main
git merge --ff-only test
git push origin main
```

Crie então uma tag estável com a mesma versão distribuída e publique uma
release sem a marca **Pre-release**:

```sh
git tag -a v6.0.0 -m "Release 6.0.0"
git push origin v6.0.0
```

O workflow de release só deve ser considerado concluído quando todos os
arquivos acima estiverem anexados, a atestação existir e o AppImage puder ser
verificado com `sha256sum`.

Para releases que incluem Android, confirme também a atestação e o checksum do
APK. A primeira configuração exige os quatro secrets documentados em
[ANDROID.md](ANDROID.md); sem a chave persistente, não publique APKs de
produção, pois versões futuras não conseguiriam atualizá-los.

## Correção de emergência

Para corrigir uma versão já estável, faça a correção primeiro em `test`, rode
toda a validação e promova a alteração para `main`. Não altere nem mova uma tag
de release já publicada: crie uma nova versão de patch, como `6.0.1`.
