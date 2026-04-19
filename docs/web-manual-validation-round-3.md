# Web manual validation — round 3 (partial)

Data da execução consolidada: **2026-04-19**.

## 1) Escopo da rodada

Rodada manual **parcial** focada em:

- reforçar regressão dos tipos já estáveis;
- validar consistência de estado da UI em transições rápidas;
- validar robustez contra payloads “parecidos” porém inválidos;
- exercitar continuidade de fluxos locais em cenário offline mais rico;
- registrar apenas evidência real (sem abrir novas frentes grandes).

## 2) Casos executados nesta rodada

1. `ypub` válido;
2. sequência rápida `xpub -> ypub -> lixo`;
3. quase-PSBT (`cHNidP8BAA`);
4. address com prefixo inválido (`bc9...`);
5. payload semelhante a Lightning, inválido (`lnxyz123`);
6. sequência `teste123 -> xpub válido -> seed válida`;
7. sequência `lnbc1testinvoice123 -> teste123 -> limpar`;
8. sequência offline mais completa com fluxos locais (não sensíveis + watch-only informativo + sensível).

## 3) Casos que passaram

- `ypub` válido detectado corretamente com classificação **estável** e rede **mainnet**;
- transição rápida `xpub -> ypub -> lixo` sem estado preso;
- quase-PSBT (`cHNidP8BAA`) classificada como `unknown`;
- address com prefixo inválido (`bc9...`) classificado como `unknown`;
- payload Lightning inválido (`lnxyz123`) classificado como `unknown`;
- sequência `teste123 -> xpub válido -> seed válida` com limpeza automática correta de sensível e sem metadado residual;
- sequência `lnbc1testinvoice123 -> teste123 -> limpar` coerente, sem aviso residual;
- cenário offline mais completo manteve coerência dos fluxos locais.

## 4) Casos inconclusivos

- `zpub` permanece **inconclusivo** por ausência de vetor canônico confiável/garantido no conjunto atual de testes manuais.

## 5) Bugs novos

- **Não surgiram bugs novos** nesta terceira rodada manual parcial.

## 6) Lições aprendidas

1. O detector está robusto para rejeitar payloads “parecidos” inválidos sem regressão aparente.
2. A UI mantém consistência em transições rápidas e mudanças de classe de sensibilidade.
3. O comportamento local offline segue coerente para os fluxos já expostos hoje na home.
4. O principal limitador atual da validação é a qualidade/disponibilidade de vetores canônicos para casos específicos (principalmente `zpub`).

## 7) Lacunas restantes (reais)

1. Vetor canônico confiável para `zpub` (positivo e negativo).
2. Cobertura adicional de testnet com vetores garantidos (endereços e extended pubkeys).
3. Fluxos watch-only mais profundos além da detecção.
4. PSBTs mais ricos (casos limítrofes e orientação de UX).
5. Mensagens de erro acionáveis e consistência de feedback em casos ambíguos.

## 8) Recomendação objetiva da próxima rodada

Executar a próxima fase funcional com escopo **estritamente direcionado às lacunas acima**, sem reabrir áreas já estáveis:

- priorizar aquisição/geração de vetores canônicos (`zpub`, testnet);
- aprofundar watch-only e PSBT em cenários funcionais curtos e reproduzíveis;
- revisar UX de erro/fallback com critérios objetivos de aprovação;
- manter rastreabilidade por evidência real em checklist + report.
