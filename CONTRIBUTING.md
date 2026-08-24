# Como contribuir

Obrigado por querer melhorar o Budget.

## Princípios do projeto

- PDFs e dados financeiros permanecem no computador da pessoa usuária;
- resultados automáticos são sugestões: a interface precisa deixar claro quando conferir um valor;
- a experiência segue o estilo e a linguagem simples dos aplicativos GNOME;
- mudanças na interface web também precisam funcionar no AppImage offline e
  na casca Android.

## Antes de enviar uma mudança

1. Crie uma branch temporária a partir de `test` e abra o pull request de volta
   para `test`. As únicas branches permanentes são `test` e `main`.
2. Na pasta `app`, execute `npm ci`, `npm test`, `npm run build` e `npm run verify`.
3. Na pasta `desktop`, execute `npm ci`, `npm test` e `npm run test:ui`.
4. Inclua os arquivos gerados `app/budget.html` e `index.html` quando mudar a interface ou a lógica da aplicação.
5. Na raiz, execute `node scripts/verify-release-version.cjs` quando a mudança
   puder afetar a versão distribuída.
6. Ao alterar a interface, execute também `cd mobile && npm ci && npm test &&
   npm run sync && npm run verify`.
7. Explique no pull request como a alteração foi testada.

Não inclua boletos, faturas ou outros documentos reais no repositório ou nos testes.

Depois de validada, uma alteração segue para `test`. A promoção de `test` para
`main` é reservada a uma versão estável e está documentada em
[docs/RELEASES.md](docs/RELEASES.md).

## Organização do código

- `app/src/core.js`: regras puras de valores e extração de texto/OCR;
- `app/src/state.js`: estado e operações sobre contas, sem dependência do DOM;
- `app/src/ui-layout.js`: regras de visibilidade e posicionamento de ações da interface;
- `app/src/dialogs.js`: foco, menu e ciclo de vida dos diálogos acessíveis;
- `app/src/template.html`: marcação, estilo e a orquestração do aplicativo;
- `app/build.py`: incorpora os módulos e dependências no HTML offline gerado.
- `mobile/`: casca Capacitor, projeto Gradle e automação do APK Android.

Os testes unitários ficam em `app/test`. O fluxo de interface real está em
`desktop/e2e/ui-flow.cjs`: ele abre o Electron sem mostrar uma janela e cobre
valores avulsos, saldo disponível, rolagem e limpeza. Em CI, essa suíte roda
com uma tela virtual; localmente ela precisa de uma sessão gráfica.

## Verificações no GitHub

Cada push para `main` ou `test` executa testes da aplicação, testes do
Electron, auditoria de dependências, geração e validação do AppImage, montagem
e verificação do APK Android de teste, SBOMs e CodeQL. Pull requests também
recebem a revisão automática de dependências.
Essas verificações complementam, mas não substituem, a conferência manual dos
valores extraídos de boletos.
