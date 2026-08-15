# Como contribuir

Obrigado por querer melhorar o Somador de Contas.

## Princípios do projeto

- PDFs e dados financeiros permanecem no computador da pessoa usuária;
- resultados automáticos são sugestões: a interface precisa deixar claro quando conferir um valor;
- a experiência segue o estilo e a linguagem simples dos aplicativos GNOME;
- mudanças na interface web também precisam funcionar no AppImage offline.

## Antes de enviar uma mudança

1. Crie uma branch a partir de `main`.
2. Na pasta `app`, execute `npm ci`, `npm test`, `npm run build` e `npm run verify`.
3. Na pasta `desktop`, execute `npm ci` e `npm test`.
4. Inclua os arquivos gerados `app/somador-de-contas.html` e `index.html` quando mudar a interface ou a lógica da aplicação.
5. Explique no pull request como a alteração foi testada.

Não inclua boletos, faturas ou outros documentos reais no repositório ou nos testes.
