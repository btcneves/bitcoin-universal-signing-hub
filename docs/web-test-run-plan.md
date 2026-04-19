# Web test run plan (manual)

Atualizado em: **2026-04-19**.

Objetivo: executar uma rodada manual real, com evidência acionável para triagem e abertura dos primeiros bugs funcionais web.

> Documento mantido por histórico. Para a execução operacional da primeira rodada, usar `docs/run-first-manual-web-validation.md`.

## 1) Pré-requisitos

1. Ambiente local preparado e estável:
   - `pnpm install`
   - `pnpm --filter web dev` (ou `pnpm dev`)
2. App acessível no navegador (ex.: `http://localhost:5173`).
3. Artefatos de referência disponíveis:
   - `docs/web-functional-checklist.md`
   - `docs/web-functional-expected-results.md`
   - `docs/web-test-report-template.md`
   - `docs/web-bug-reporting-flow.md`
4. Apenas payloads de laboratório (nunca seed/chave real).

## 2) Ambiente recomendado da rodada

- Janela anônima/privada sem extensões injetando scripts.
- Console do navegador aberto desde o início.
- Gravação de evidência organizada em pasta única da rodada (ex.: `evidence/web-run-YYYY-MM-DD/`).
- Registrar no relatório:
  - OS
  - Browser/version
  - Node/pnpm
  - commit testado

## 3) Ordem obrigatória de execução

### Fase 1 — Smoke P0 (bloqueadores)

Executar primeiro:

- WF-A01, WF-A02, WF-A03, WF-A04
- WF-B03, WF-B05
- WF-C01

**Objetivo P0**: garantir que o app abre, responde, trata erros e limpa automaticamente payloads sensíveis detectados.

### Fase 2 — Núcleo funcional P1

Executar:

- WF-A05
- WF-B01, WF-B02, WF-B04, WF-B06, WF-B09, WF-B10

**Objetivo P1**: validar robustez da detecção de tipos estáveis (válidos e inválidos).

### Fase 3 — Cobertura complementar P2

Executar:

- WF-B07, WF-B08, WF-B11, WF-C02

**Objetivo P2**: validar limites heurísticos/experimentais e comportamento offline sem bloquear rodada.

## 4) Quando registrar no relatório

Registrar no `docs/web-test-report-template.md`:

- imediatamente após cada caso (não deixar para o fim);
- sempre com esperado vs observado;
- com status explícito: passou / falhou / parcial;
- com prioridade do caso (P0/P1/P2).

## 5) Quando abrir issue

Abrir issue ao final de cada bloco (P0, depois P1, depois P2) quando houver casos **falhou/parcial** com divergência real.

- Template obrigatório: `.github/ISSUE_TEMPLATE/web_functional_bug.yml`
- Referenciar ID `WF-*`, commit, trecho do relatório e evidências.
- Uma issue por bug (não agrupar comportamentos distintos).

## 6) Máscara de payload sensível

- Nunca registrar seed completa, chave privada, xprv real, PSBT de produção ou dados pessoais.
- Regras mínimas:
  - seed: mostrar no máximo 2 palavras iniciais + `***`
  - xpub/ypub/zpub: mostrar prefixo + 6-10 chars + `...`
  - PSBT/base64: truncar mantendo apenas início/fim (`AAAA...ZZZZ`)

## 7) Coleta mínima de evidências

Para todo caso **falhou/parcial**, anexar:

1. Screenshot da tela inteira com estado final do caso.
2. Console log relevante (erro/warn/info ligado ao caso).
3. Passos de reprodução numerados e curtos.
4. Resultado esperado e observado lado a lado.

## 8) Critério de encerramento da rodada

A rodada é considerada concluída quando:

1. Todos os casos P0 e P1 foram executados e documentados.
2. Casos falhos/parciais têm issue aberta com evidência mínima.
3. Casos P2 foram executados ou explicitamente marcados como não executados com justificativa.
