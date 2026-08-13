# Somador de Contas

Ferramenta simples para somar valores de boletos e faturas em PDF.

Feita para uso pessoal. Não tem grandes pretensões: só evita que você precise digitar os valores um por um. Foi pensada no formato de boletos bancários brasileiros (procura por rótulos como “valor a pagar”, “total a pagar”, “valor cobrado” etc.).

Tudo roda localmente no seu computador. Nenhum arquivo sai da máquina.

![Somador de Contas](screenshot.png)

## Como usar

**No navegador (sem instalar nada):**

- Abra o [`index.html`](index.html) ou o [`app/somador-de-contas.html`](app/somador-de-contas.html)

Funciona offline.

**AppImage (Linux):**

Baixe o `.AppImage` na [página de releases](../../releases), dê permissão e execute:

```sh
chmod +x SomadorDeContas-*.AppImage
./SomadorDeContas-*.AppImage

Não precisa de FUSE.

## Observações

Os valores encontrados são editáveis. Se a leitura falhar em algum boleto, é só corrigir na hora.
Cada linha mostra um indicador de confiança (✓ / ⚠ / ?).
Não é perfeito. Boletos muito diferentes do padrão brasileiro podem precisar de ajuste manual.

## Privacidade

Nada é enviado para a internet. A leitura do PDF e a soma acontecem só no seu computador.

## Compilando do código-fonte


### 1. Gerar o HTML
cd app
npm install
python3 build.py


### 2. (opcional) Gerar o AppImage
cd ../desktop
npm install
../scripts/build-appimage.sh

## Licença
GNU GPLv3.
Usa pdf.js (Apache 2.0) e, no AppImage, Electron (MIT).
