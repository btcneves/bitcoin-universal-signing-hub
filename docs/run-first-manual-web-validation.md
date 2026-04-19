# Primeira rodada real de validação manual web

Atualizado em: **2026-04-19**.

Objetivo: executar a **primeira rodada operacional real** no `apps/web`, coletar evidências mínimas e abrir bugs funcionais com triagem consistente.

## 1) Pré-requisitos (5 min)

1. Instalar dependências: `pnpm install`
2. Subir app web: `pnpm --filter web dev` (ou `pnpm dev` no monorepo)
3. Abrir `http://localhost:5173` em aba anônima (sem extensões)
4. Deixar o console aberto
5. Ter estes artefatos à mão:
   - `docs/web-functional-checklist.md`
   - `docs/web-functional-expected-results.md`
   - `docs/web-test-report-template.md`
   - `docs/web-bug-reporting-flow.md`
   - `.github/ISSUE_TEMPLATE/web_functional_bug.yml`

## 2) Ordem operacional da rodada

Executar nesta ordem, sem pular P0:

1. **P0 (bloqueadores):** WF-A01, WF-A02, WF-A03, WF-A04, WF-B03, WF-B05, WF-C01
2. **P1 (núcleo estável):** WF-A05, WF-B01, WF-B02, WF-B04, WF-B06, WF-B09, WF-B10
3. **P2 (complementar):** WF-B07, WF-B08, WF-B11, WF-C02

## 3) Quando preencher o test report

Preencher `docs/web-test-report-template.md` **imediatamente após cada caso**:

- ID do caso (`WF-*`)
- prioridade (P0/P1/P2)
- maturidade (estável/heurístico/experimental)
- esperado vs observado
- status (passou/falhou/parcial)
- evidência mínima se houver falha/parcial

## 4) Quando abrir issue funcional

Abrir issue **somente** quando houver divergência real com status **falhou** ou **parcial**.

Usar `.github/ISSUE_TEMPLATE/web_functional_bug.yml` e sempre incluir:

- ID `WF-*`
- link do relatório da rodada
- ambiente + commit testado
- esperado vs observado
- reprodutibilidade
- evidências (print/log)

Regra: **1 comportamento divergente = 1 issue**.

## 5) Máscara de payload sensível (obrigatório)

Nunca registrar seed/chave real. Use máscara:

- seed: `word1 word2 ***`
- xpub/ypub/zpub: `xpub6ABCDEF...`
- PSBT/base64: `AAAA...ZZZZ`
- dados pessoais: remover/anonimizar antes de anexar

## 6) Evidência mínima por bug

Para cada caso falhou/parcial:

1. screenshot da tela com estado final;
2. trecho do console relevante;
3. passos numerados curtos para reprodução;
4. esperado vs observado em texto direto.

## 7) Critério de encerramento da primeira rodada

A rodada inicial está concluída quando:

1. todos os casos P0 e P1 foram executados e registrados;
2. todo falhou/parcial relevante virou issue com evidência mínima;
3. P2 foi executado ou marcado como não executado com justificativa.
