# Android e Obtainium

O Budget para Android usa Capacitor, mas continua sendo a mesma interface web
offline da versão para navegador e AppImage. PDFs, OCR e valores não usam rede
nem solicitam permissão de armazenamento amplo: o seletor de arquivos do
Android entrega ao aplicativo somente os documentos escolhidos.

## Instalar e atualizar pelo Obtainium

1. No Obtainium, adicione `https://github.com/victorffrock/budget`.
2. Escolha **GitHub** como fonte, caso ele não seja reconhecido
   automaticamente.
3. Use o filtro de APK `^Budget-.*-universal\\.apk$` para ignorar os arquivos
   auxiliares da release.
4. Ative **Verify Latest Tag** e **Check for Repo Rename**.
5. Instale o APK oferecido. O Android pedirá confirmação em cada instalação ou
   atualização; isso é uma proteção do sistema operacional.

O Obtainium detecta a release, baixa o APK e mostra a notificação. Ele não
substitui a confirmação de instalação do Android sem mecanismos avançados
opcionais, como Shizuku.

## Assinatura: requisito permanente

Uma atualização Android só é aceita quando o APK mantém o mesmo application
ID, usa a mesma chave de assinatura e possui `versionCode` maior. O Budget usa
o ID `br.com.victorferreirafranco.budget`; a versão de teste usa o sufixo
`.test` para não conflitar com a estável.

Crie a chave **uma vez**, em computador confiável com Java 21 ou superior. Não
envie a chave ou as senhas pelo chat e nunca a adicione ao Git:

```sh
export BUDGET_KEYSTORE_OUTPUT="$PWD/budget-release.p12"
export BUDGET_ANDROID_KEYSTORE_PASSWORD='uma-senha-longa-e-unica'
export BUDGET_ANDROID_KEY_PASSWORD='outra-senha-longa-e-unica'
export BUDGET_ANDROID_KEY_ALIAS='budget-release'
./scripts/create-android-keystore.sh
```

Faça uma cópia criptografada do arquivo `.p12` e guarde as três credenciais em
um gerenciador de senhas. Perder a chave impede publicar atualizações para
instalações existentes.

Depois, adicione estes quatro **Actions secrets** no repositório GitHub:

| Secret | Valor |
| --- | --- |
| `BUDGET_ANDROID_KEYSTORE_BASE64` | saída de `base64 -w0 budget-release.p12` |
| `BUDGET_ANDROID_KEYSTORE_PASSWORD` | senha do arquivo `.p12` |
| `BUDGET_ANDROID_KEY_ALIAS` | alias usado na criação, por padrão `budget-release` |
| `BUDGET_ANDROID_KEY_PASSWORD` | senha da chave privada |

O workflow de release decodifica a chave apenas no runner temporário, assina o
APK e apaga o ambiente ao final. A chave não aparece em logs, artefatos ou
controle de versão.

## Desenvolvimento e validação

```sh
cd mobile
npm ci
npm test
npm run build:debug
```

O APK de teste usa o ID `br.com.victorferreirafranco.budget.test`; ele é
intencionalmente separado do APK estável. Para criar um APK de release local,
defina as variáveis de assinatura acima e execute `npm run build:release`.

Cada release publicada no GitHub anexa `Budget-<versão>-universal.apk`, o SBOM
CycloneDX específico do Android, `SHA256SUMS-Android.txt` e uma atestação de
procedência. O CI também monta e verifica o APK de teste em todo push e pull
request.
