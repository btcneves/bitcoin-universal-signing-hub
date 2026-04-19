# Web bug reporting flow (manual validation)

Atualizado em: **2026-04-19**.

Fluxo padrão da fase atual: **testei -> documentei -> abri issue**.

## Passo 1 — Executar checklist por prioridade

1. Seguir a ordem definida em `docs/web-test-run-plan.md`.
2. Executar primeiro casos **P0**, depois **P1** e por fim **P2**.
3. Usar `docs/web-functional-checklist.md` como fonte de casos e `docs/web-functional-expected-results.md` como referência de aceitação.

## Passo 2 — Registrar evidência no relatório

1. Preencher `docs/web-test-report-template.md` por caso executado.
2. Mascarar payload sensível (seed, chaves e dados privados reais).
3. Capturar evidência mínima para divergências:
   - screenshot da UI
   - log de console
   - passos de reprodução objetivos

## Passo 3 — Decidir se abre issue

Abrir issue quando o status do caso for **falhou** ou **parcial** e houver divergência real entre esperado e observado.

Não abrir issue quando:

- o caso passou integralmente;
- a divergência for apenas dúvida de documentação (neste caso, ajustar docs primeiro).

## Passo 4 — Abrir issue funcional web

1. Criar issue com `.github/ISSUE_TEMPLATE/web_functional_bug.yml`.
2. Referenciar:
   - ID da checklist (`WF-*`)
   - commit testado
   - seção correspondente no relatório manual
3. Abrir **uma issue por comportamento** (evitar issue agregada com múltiplos bugs).

## Critério mínimo para issue de bug funcional

- Caso da checklist identificado.
- Ambiente e versão do commit informados.
- Resultado esperado e observado claramente distintos.
- Reprodutibilidade indicada.
- Impacto em zona de segurança indicado (quando aplicável).
- Evidência anexada (print/log/relatório).

## Convenção de prioridade sugerida

- **P0**: risco de segurança, perda de controle do fluxo, falso positivo/negativo crítico em sensível, impossibilidade de executar fluxo principal.
- **P1**: funcionalidade principal degradada com workaround.
- **P2**: inconsistência de UX, texto, clareza de estado ou problema de baixa frequência sem risco direto.
