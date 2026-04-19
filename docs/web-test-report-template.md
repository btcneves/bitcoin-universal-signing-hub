# Web manual test report template

Use este modelo para registrar uma sessão real de teste manual do `apps/web`.

## 1) Identificação da execução

- Data:
- Responsável:
- Objetivo da rodada (ex.: smoke P0, regressão pós-ajuste):
- Plano usado (ex.: `docs/web-test-run-plan.md`):

## 2) Ambiente

- Sistema operacional:
- Navegador + versão:
- Node.js (`node -v`):
- pnpm (`pnpm -v`):
- Commit testado (`git rev-parse --short HEAD`):
- URL local utilizada:
- Conectividade no momento do teste (online/offline):

## 3) Registro dos casos

> Repetir a seção abaixo para cada caso executado (ex.: WF-A01, WF-B03).

### Caso: `<ID da checklist>`

- Fluxo:
- Prioridade de execução (P0 / P1 / P2):
- Maturidade esperada (estável / heurístico / experimental):
- Pré-condições específicas:
- Payload usado (mascarado quando sensível):
- Passos executados:
- Resultado esperado:
- Resultado observado:
- Status: **passou / falhou / parcial**
- Reprodutibilidade: **sempre / intermitente / não reproduzido novamente**
- Impacto de zona de segurança (Zone 0 / Zone 1 / Zone 2 / Unknown):
- Evidências:
  - Screenshot(s):
  - Console log:
  - Logs adicionais:
- Observações:

## 4) Resumo da rodada

- Total de casos executados:
- Passou:
- Falhou:
- Parcial:
- Casos bloqueados (se houver):
- Riscos percebidos:
- Próximos passos sugeridos:

## 5) Itens para abrir issue

Para cada falha/parcial relevante:

- Título proposto da issue:
- Checklist case ID:
- Severidade sugerida (P0/P1/P2):
- Reprodutibilidade:
- Resultado esperado (resumo):
- Resultado observado (resumo):
- Link para evidências:
- Link para trecho do relatório da rodada:
- Observações para triagem:
