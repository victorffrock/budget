# Somador de Contas

Soma o valor de boletos em PDF automaticamente. Arraste os arquivos para a
janela, confira os valores identificados e pronto — sem digitar nada à mão
(a não ser que o app não consiga ler algum boleto, aí é só corrigir).

**100% local.** Nenhum arquivo, nem o texto extraído dele, sai do seu
computador. O pdf.js (biblioteca que lê o PDF) vem embutido dentro do
próprio `.html` — a página funciona até sem internet.

Visual baseado no [GNOME HIG](https://developer.gnome.org/hig/) — paleta,
tipografia e componentes (boxed list, header bar, status page) seguem as
diretrizes oficiais do GNOME.

<![Somador de Contas](screenshot.png)

## Como usar

**Opção 1 — só o navegador, sem instalar nada:**
Baixe [`app/somador-de-contas.html`](app/somador-de-contas.html) e abra
com dois cliques. Funciona em qualquer sistema com um navegador.

**Opção 2 — AppImage (Linux), com ícone e janela própria:**
Baixe o `.AppImage` da [última release](../../releases), dê permissão de
execução e rode:

```sh
chmod +x SomadorDeContas-*.AppImage
./SomadorDeContas-*.AppImage
```

Não precisa de FUSE instalado — o runtime já faz fallback automático para
extrair-e-rodar quando o FUSE não está disponível.

## Como funciona a leitura dos boletos

O app procura, no texto do PDF, rótulos comuns em boletos e faturas
brasileiras (`valor a pagar`, `total a pagar`, `valor cobrado`, `valor
total da fatura`, etc.), cada um com uma pontuação de confiabilidade.
Quando nenhum rótulo é encontrado, ele só arrisca um palpite (marcado como
"confira") se houver um valor monetário isolado no documento, ou um valor
claramente maior que os demais — nunca "o número que mais se repete", que
pode facilmente ser o valor errado num boleto com desconto/juros
detalhados.

Todo valor mostrado é editável com um clique, e cada linha tem um
indicador (✓ / ⚠ / ?) mostrando o quão confiável foi a identificação.

## Estrutura do repositório

```
app/
  src/template.html   – HTML/CSS/JS fonte (com placeholders de build)
  build.py            – embute o pdf.js + worker + ícone → HTML final
  somador-de-contas.html – build pronto para usar
desktop/
  main.js             – wrapper Electron (janela, ícone, menu)
  package.json        – config do electron-builder
  assets/icon.png      – ícone do app (gerado por assets/make_icon.py)
scripts/
  build-appimage.sh   – gera o AppImage com o runtime sem FUSE
```

## Recompilando a partir do código-fonte

```sh
# 1. gerar o HTML autocontido
cd app
npm install
python3 build.py          # gera app/somador-de-contas.html

# 2. (opcional) empacotar como AppImage
cd ../desktop
npm install
../scripts/build-appimage.sh
```

Para regenerar o ícone (`desktop/assets/icon.png`):

```sh
python3 desktop/assets/make_icon.py
```

## Dependências e licenças

- [pdf.js](https://github.com/mozilla/pdf.js) (Mozilla, Apache License 2.0) —
  embutido no HTML final, usado apenas para extrair o texto do PDF no
  próprio navegador do usuário.
- [Electron](https://www.electronjs.org/) (MIT) — usado só para o wrapper
  desktop opcional (AppImage); a página em si não depende dele.

## Privacidade

Nenhuma rede é usada em nenhum momento — não há `fetch`, `XMLHttpRequest`
nem `<script src="...">` externo em lugar nenhum do app. A leitura do PDF
e a soma dos valores acontecem inteiramente no processo local (navegador
ou o app Electron).
