# Somador de Contas

Ferramenta simples para somar valores de boletos e faturas em PDF.

Feita para uso pessoal. Não tem grandes pretensões: só evita que você precise digitar os valores um por um. Foi pensada no formato de boletos bancários brasileiros (procura por rótulos como “valor a pagar”, “total a pagar”, “valor cobrado” etc.).

Tudo roda localmente no seu computador. Nenhum arquivo sai da máquina.

![Somador de Contas](screenshot.png)

## Como usar

**No navegador (sem instalar nada):**

- Abra o [index.html](index.html) ou o [app/somador-de-contas.html](app/somador-de-contas.html).

Funciona offline. Confira valores identificados com baixa confiança antes de pagar.

**AppImage (Linux):**

Baixe o `.AppImage` na [página de releases](../../releases), dê permissão e execute:

```sh
chmod +x Somador-de-Contas-*-x86_64.AppImage
./Somador-de-Contas-*-x86_64.AppImage
```

O AppImage usa runtime estático e não requer FUSE.

### Verificar um download

Cada release inclui o arquivo `SHA256SUMS.txt`. Após baixar os arquivos na
mesma pasta, confira a integridade antes de executar:

```sh
sha256sum -c SHA256SUMS.txt
```

As releases futuras também registram a procedência do AppImage no GitHub. Com
o GitHub CLI, ela pode ser verificada assim:

```sh
gh attestation verify Somador-de-Contas-*-x86_64.AppImage \
  --repo victorffrock/somador-de-contas
```

### Experiência GNOME

O AppImage usa uma barra de cabeçalho e menu de aplicativo no estilo GNOME. No botão de menu estão o manual integrado, a tela **Sobre** e as ações de adicionar ou limpar contas. No Linux, essas mesmas ações também aparecem no menu nativo **Arquivo** e **Ajuda**.

Atalhos disponíveis:

- `Ctrl+O`: adicionar boletos;
- `F1`: abrir o manual;
- `Esc`: fechar o menu ou uma janela auxiliar.

### Atualizações pelo Gear Lever

A partir da versão 3.1.0, o AppImage traz os dados de atualização do GitHub incorporados. Abra a versão 3.1.0 ou posterior no Gear Lever e integre-a ao menu de aplicações. Depois disso, o próprio Gear Lever identifica e instala as próximas releases automaticamente.

## Observações

Os valores encontrados são editáveis. A edição aceita somente números brasileiros, como `123,45` ou `1.234,56`; uma entrada inválida preserva o valor anterior. Cada linha mostra um indicador de confiança (✓ / ⚠ / ?).

### Valores avulsos

Use **Adicionar valor avulso** para incluir uma despesa que não está em um PDF, como estacionamento ou uma taxa. A descrição é opcional, o valor usa o mesmo formato brasileiro e entra imediatamente no total. Valores avulsos também podem ser editados ou removidos a qualquer momento.

### Dinheiro disponível

Informe quanto dinheiro você tem disponível no cartão abaixo do total. Ele está disponível desde o início, mesmo antes de adicionar contas. O aplicativo calcula na hora o saldo após pagar tudo: mostra o que sobra, avisa quando o saldo fica zerado ou informa quanto faltará. O campo usa o mesmo formato brasileiro dos demais valores, como `123,45` ou `1.234,56`.

Não é perfeito. Boletos muito diferentes do padrão brasileiro podem precisar de ajuste manual.

### PDFs escaneados (OCR)

A partir da versão 4.0, se o PDF não tiver texto selecionável — por exemplo, por ser um documento escaneado — o aplicativo tenta usar OCR local em até quatro páginas. O modelo de português faz parte do próprio aplicativo: ele não baixa nada e não envia o PDF para a internet.

Como toda leitura de imagem pode confundir caracteres, qualquer valor obtido por OCR aparece com o indicador amarelo e deve ser conferido antes do pagamento. Para proteger a memória do computador, o OCR é oferecido para arquivos de até 25 MB; documentos maiores ainda podem ter o valor informado manualmente.

As regras que interpretam o texto do OCR possuem casos de teste sanitizados, incluindo rótulos com ruído e valores conflitantes. Isso ajuda a evitar que uma alteração futura escolha um valor ambíguo automaticamente.

## Privacidade

Nada é enviado para a internet. A leitura do PDF, o OCR e a soma acontecem só no seu computador.

## Compilando do código-fonte

Pré-requisitos: Node.js 22.13 ou superior e Python 3. Para gerar o arquivo `.zsync` de atualização, instale também `zsync`.

### 1. Gerar o HTML

```sh
cd app
npm ci
npm test
npm run build
npm run verify
```

Isso atualiza `app/somador-de-contas.html` e `index.html`.

### 2. Gerar o AppImage

```sh
cd ../desktop
npm ci
npm test
npm run test:ui
../scripts/build-appimage.sh
```

`npm run test:ui` abre uma janela Electron invisível e valida os fluxos de
interface, incluindo valores avulsos, saldo disponível, rolagem e limpeza.

Para uma release deste repositório, use:

```sh
APPIMAGE_UPDATE_INFORMATION='gh-releases-zsync|victorffrock|somador-de-contas|latest|Somador-de-Contas-*-x86_64.AppImage.zsync' \
../scripts/build-appimage.sh
```

## Licença

GNU GPLv3. Usa pdf.js e Tesseract.js (Apache 2.0) e, no AppImage, Electron (MIT).
