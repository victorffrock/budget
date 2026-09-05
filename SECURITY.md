# Segurança

## Versões com suporte

Recebe correções de segurança somente a versão estável mais recente publicada
na [página de releases](../../releases). Pré-releases da branch `test` existem
para validação e não substituem uma versão estável.

## Relatar uma vulnerabilidade

Não publique detalhes exploráveis em uma issue. Entre em contato com [@victorffrock](https://github.com/victorffrock) pelo GitHub, com uma descrição do problema, o impacto e passos seguros para reproduzi-lo. O objetivo é confirmar o recebimento e definir uma correção antes de qualquer divulgação pública.

## Privacidade do aplicativo

O Budget processa PDFs, OCR e valores localmente. Alterações que possam introduzir envio de documentos, telemetria ou dependência de serviços externos precisam ser discutidas antes de serem aceitas.

## Integridade das releases

As releases incluem um arquivo de checksums por arquitetura
(`SHA256SUMS-x86_64.txt` ou `SHA256SUMS-aarch64.txt`) para conferir os arquivos
baixados. Quando o workflow da release registra uma atestação, o GitHub também
guarda a procedência de cada AppImage. O repositório publica ainda SBOMs no
formato CycloneDX para as dependências da aplicação e do desktop.

Antes de executar um arquivo, baixe os assets da mesma release e rode:

```sh
sha256sum -c --ignore-missing SHA256SUMS-x86_64.txt
gh attestation verify Budget-*-aarch64.AppImage \
  --repo victorffrock/budget
```

O segundo comando requer o GitHub CLI e é aplicável quando a release tem uma
atestação. Ele confirma a origem do artefato; a soma SHA-256 confirma que o
arquivo baixado não foi alterado.

## Controles automatizados

| Controle | Quando roda | Objetivo |
| --- | --- | --- |
| Testes da aplicação e do Electron | push para `main` e `test` | detectar regressões de cálculo e interface |
| Auditoria do npm | CI | impedir dependências com vulnerabilidades altas conhecidas |
| Revisão de dependências | pull requests | destacar novas dependências vulneráveis antes da mesclagem |
| CodeQL | push e pull requests | analisar padrões de código potencialmente inseguros |
| Validação do AppImage e SBOM | CI e release | verificar atualização, distribuição e inventário de componentes |
| Atestação de procedência | publicação de release | vincular o AppImage ao workflow oficial |

As Actions são fixadas em commits imutáveis e atualizadas pelo Dependabot. As
atualizações automáticas são abertas primeiro em `test`, passam pelas mesmas
verificações e só chegam a `main` por uma promoção validada. O Electron é
executado com isolamento de contexto, sandbox e integração Node desativada na
interface de usuário. Navegações e pop-ups externos são bloqueados dentro do
aplicativo; links HTTPS aprovados são abertos no navegador padrão.
