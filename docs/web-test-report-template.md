# Web manual test report template

Use este modelo para registrar uma sessão real de teste manual do `apps/web`.

## 1) Identificação da execução

- Data:
- Responsável:
- Objetivo da rodada (ex.: smoke P0, regressão pós-ajuste):

## 2) Ambiente

- Sistema operacional:
- Navegador + versão:
- Node.js (`node -v`):
- pnpm (`pnpm -v`):
- Commit testado (`git rev-parse --short HEAD`):
- URL local utilizada:

## 3) Registro dos casos

> Repetir a seção abaixo para cada caso executado (ex.: WF-A01, WF-B03).

### Caso: `<ID da checklist>`

- Fluxo:
- Maturidade esperada (estável / heurístico / experimental):
- Pré-condições específicas:
- Payload usado (mascarado quando sensível):
- Passos executados:
- Resultado esperado:
- Resultado observado:
- Status: **passou / falhou / parcial**
- Observações:
- Evidências (print/console/log):

## 4) Resumo da rodada

- Total de casos executados:
- Passou:
- Falhou:
- Parcial:
- Riscos percebidos:
- Próximos passos sugeridos:

## 5) Itens para abrir issue

Para cada falha/parcial relevante:

- Título proposto da issue:
- Severidade (baixa/média/alta):
- Reprodutibilidade (sempre/intermitente):
- Link para evidência:
- Observações para triagem:
