# Budget

Ferramenta simples para somar valores de boletos e faturas em PDF.

Feita para uso pessoal. Não tem grandes pretensões: só evita que você precise digitar os valores um por um. Foi pensada no formato de boletos bancários brasileiros (procura por rótulos como “valor a pagar”, “total a pagar”, “valor cobrado” etc.).

Tudo roda localmente no seu computador. Nenhum arquivo sai da máquina.

![Budget](screenshot.png)

## Como usar

**No navegador (sem instalar nada):**

- Abra o [index.html](index.html) ou o [app/budget.html](app/budget.html).

Funciona offline. Confira valores identificados com baixa confiança antes de pagar.

**AppImage (Linux):**

Baixe o arquivo compatível com a arquitetura do seu computador na [página de
releases](../../releases), dê permissão e execute. Há versões para computadores
Intel/AMD 64 bits (`x86_64`) e ARM 64 bits (`aarch64`, como Raspberry Pi 4/5):

```sh
# Intel/AMD 64 bits
chmod +x Budget-*-x86_64.AppImage
./Budget-*-x86_64.AppImage

# ARM 64 bits
chmod +x Budget-*-aarch64.AppImage
./Budget-*-aarch64.AppImage
```

O AppImage usa runtime estático e não requer FUSE.

### Verificar um download

Cada release inclui um arquivo de checksums por arquitetura, como
`SHA256SUMS-x86_64.txt` ou `SHA256SUMS-aarch64.txt`. Após baixar os arquivos
na mesma pasta, confira a integridade antes de executar. O parâmetro
`--ignore-missing` permite verificar somente os arquivos que você baixou:

```sh
sha256sum -c --ignore-missing SHA256SUMS-x86_64.txt
```

Quando o workflow da release registra uma atestação de procedência, também é
possível confirmar que o AppImage foi produzido pelo workflow oficial do
repositório. Com o [GitHub CLI](https://cli.github.com/), use:

```sh
gh attestation verify Budget-*-aarch64.AppImage \
  --repo victorffrock/budget
```

Os arquivos `SBOM-app-<arquitetura>.cdx.json` e
`SBOM-desktop-<arquitetura>.cdx.json` listam, respectivamente, as dependências
da aplicação web e do aplicativo Electron. Eles estão no formato aberto
CycloneDX e servem para auditoria; não são necessários para abrir o programa.

### Experiência GNOME

O AppImage usa uma barra de cabeçalho e menu de aplicativo no estilo GNOME. No botão de menu estão o manual integrado, a tela **Sobre** e as ações de adicionar ou limpar contas. No Linux, essas mesmas ações também aparecem no menu nativo **Arquivo** e **Ajuda**.

No mesmo menu, em **Aparência**, o modo **Automático** acompanha o tema do sistema. Na versão web, ele acompanha a preferência de tema do navegador. Os modos **Claro** e **Escuro** podem ser escolhidos manualmente e ficam salvos somente neste computador.

No GNOME, o AppImage também acompanha a cor de destaque escolhida em **Configurações → Aparência** (azul, verde, roxo etc.), inclusive quando ela muda enquanto o aplicativo está aberto. Essa integração é local e opcional: fora do GNOME, ou se a preferência não estiver disponível, o Budget mantém a paleta azul padrão. A versão web também usa essa paleta padrão, pois navegadores não expõem a cor de destaque do sistema com segurança.

Atalhos disponíveis:

- `Ctrl+O`: adicionar boletos;
- `F1`: abrir o manual;
- `Esc`: fechar o menu ou uma janela auxiliar.

### Atualizações pelo Gear Lever

O AppImage do Budget traz os dados de atualização do GitHub incorporados. Abra
a versão atual no Gear Lever e integre-a ao menu de aplicações. Depois disso,
o próprio Gear Lever identifica e instala as próximas releases automaticamente.

Esta mudança de identidade exige uma atualização manual única para instalações
anteriores: baixe o AppImage atual na página de releases e integre-o novamente.
Após essa primeira instalação, as atualizações voltam a ser automáticas.

As versões de teste também podem ser integradas no Gear Lever. Elas usam um
canal separado: recebem apenas novos testes e nunca substituem a instalação
estável. Elas possuem outra identidade de aplicativo e ícone próprio, portanto
podem coexistir com a versão estável no menu de aplicações e no Gear Lever. A
interface de uma versão de teste mostra a marca **TESTE** ao lado do nome do
aplicativo para evitar confusão.

### Versões estáveis e de teste

O projeto mantém duas branches permanentes:

- `test`: recebe mudanças e pré-releases para validação;
- `main`: contém somente versões estáveis publicadas.

Uma pré-release nunca substitui a versão estável indicada pelo Gear Lever. A
promoção para `main` só acontece depois dos testes automatizados e da
verificação manual da pré-release. O processo completo de publicação está em
[docs/RELEASES.md](docs/RELEASES.md).

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

Isso atualiza `app/budget.html` e `index.html`.

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
Em máquinas sem sessão gráfica, execute-a em uma tela virtual, por exemplo com
`xvfb-run --auto-servernum npm run test:ui`.

De volta à raiz do repositório, confira também se as versões distribuídas
continuam sincronizadas:

```sh
node scripts/verify-release-version.cjs
```

Para uma release deste repositório, use:

```sh
APPIMAGE_UPDATE_INFORMATION='gh-releases-zsync|victorffrock|budget|latest|Budget-x86_64.AppImage.zsync' \
../scripts/build-appimage.sh x86_64
```

Para reproduzir localmente o canal de testes, use o nome de arquivo fixo e a
tag contínua `test`:

```sh
BUDGET_BUILD_CHANNEL=test \
APPIMAGE_UPDATE_INFORMATION='gh-releases-zsync|victorffrock|budget|test|Budget-test-x86_64.AppImage.zsync' \
../scripts/build-appimage.sh x86_64
```

Para ARM64, execute o mesmo comando em uma máquina ARM64, trocando a
arquitetura e o nome do arquivo por `aarch64`. O workflow do GitHub faz isso
automaticamente para as duas arquiteturas.

## Licença

GNU GPLv3. Usa pdf.js e Tesseract.js (Apache 2.0) e, no AppImage, Electron (MIT).
