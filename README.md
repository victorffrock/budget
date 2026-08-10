# Somador de Contas

Ferramenta simples para somar valores de boletos e faturas em PDF.

Arraste seus boletos e veja o total automaticamente. Tudo processado **100% no seu navegador** — nenhum arquivo é enviado para nenhum servidor.

![Somador de Contas](screenshot.png)

---

## Funcionalidades

- Arraste e solte (ou selecione) múltiplos PDFs
- Extração automática do valor a pagar
- Identificação da data de vencimento (quando disponível)
- Edição manual do valor (clique no valor para corrigir)
- Indicador de confiança (verde / amarelo / vermelho)
- Total atualizado em tempo real
- Interface limpa e responsiva

---

## Como usar

1. Abra o arquivo `index.html` no navegador (Chrome, Firefox ou Edge recomendados)
2. Arraste os PDFs dos boletos para a área indicada (ou clique para selecionar)
3. Aguarde a leitura automática
4. Confira os valores (bolinha amarela ou vermelha = vale a pena revisar)
5. Clique em qualquer valor para editá-lo manualmente se necessário

---

## Limitações

- Funciona apenas com PDFs que contenham **texto selecionável** (não funciona bem com boletos escaneados ou convertidos apenas em imagem)
- A extração automática não é 100% perfeita em todos os layouts de boleto — sempre confira o valor
- Requer conexão com a internet apenas na primeira vez (para carregar o PDF.js). Depois disso funciona offline se o navegador cachear a biblioteca

---

## Privacidade

Todo o processamento acontece localmente no seu navegador.  
Nenhum arquivo, valor ou informação é enviado para nenhum servidor.

---

## Tecnologias

- HTML + CSS + JavaScript puro
- [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla)

---

## Estrutura do projeto

somador-de-contas/
├── index.html
├── LICENSE
└── README.md

---

## Licença

Este projeto está licenciado sob a [GNU General Public License v3.0](LICENSE).

---

## Aviso

Esta ferramenta é apenas uma ajuda para organização.  
Sempre confira os valores extraídos antes de efetuar qualquer pagamento.
