# Segurança

## Versões com suporte

Recebe correções de segurança apenas a versão mais recente publicada na página de releases.

## Relatar uma vulnerabilidade

Não publique detalhes exploráveis em uma issue. Entre em contato com [@victorffrock](https://github.com/victorffrock) pelo GitHub, com uma descrição do problema, o impacto e passos seguros para reproduzi-lo. O objetivo é confirmar o recebimento e definir uma correção antes de qualquer divulgação pública.

## Privacidade do aplicativo

O Somador de Contas processa PDFs, OCR e valores localmente. Alterações que possam introduzir envio de documentos, telemetria ou dependência de serviços externos precisam ser discutidas antes de serem aceitas.

## Integridade das releases

As releases incluem `SHA256SUMS.txt` para conferir os arquivos baixados. A
automação também gera uma atestação de procedência do AppImage no GitHub e
publica SBOMs no formato CycloneDX para as dependências da aplicação e do
desktop. Essas verificações ajudam a confirmar que o arquivo veio do workflow
oficial e permitem revisar os componentes incluídos na distribuição.

## Automação de segurança

O repositório executa testes, auditoria de dependências, revisão de novas
dependências em pull requests, análise CodeQL e validação do AppImage. As
Actions são fixadas em commits imutáveis e atualizadas pelo Dependabot.
