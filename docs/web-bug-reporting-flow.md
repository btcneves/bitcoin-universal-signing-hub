# Web bug reporting flow (manual validation)

Fluxo padrão para a fase atual: **testei -> documentei -> abri issue**.

## Passo 1 — Executar checklist

1. Rodar os casos da `docs/web-functional-checklist.md`.
2. Priorizar primeiro fluxos de maturidade **estável**, depois **heurístico** e **experimental**.

## Passo 2 — Registrar evidência

1. Preencher `docs/web-test-report-template.md` para cada caso executado.
2. Mascarar payload sensível (seed, chaves e dados privados reais).
3. Incluir print/log sempre que houver divergência.

## Passo 3 — Abrir issue funcional web

1. Criar issue usando `.github/ISSUE_TEMPLATE/web_functional_bug.yml`.
2. Referenciar o ID da checklist e o relatório da execução.
3. Separar bug por comportamento (evitar issue agregando problemas não relacionados).

## Critério mínimo para issue de bug funcional

- Caso da checklist identificado.
- Ambiente e versão do commit informados.
- Resultado esperado e observado claramente distintos.
- Evidência anexada.
