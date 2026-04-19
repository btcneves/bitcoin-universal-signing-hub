# Web manual validation — rodada 2 (parcial)

Atualizado em: **2026-04-19**.

## 1) Escopo da rodada

Rodada manual **parcial** de continuidade, focada em confirmar robustez após as correções da rodada 1 e validar transições de estado da UI em sequência rápida, sem abrir novas frentes de produto.

Foco principal:

- detecção de payloads válidos e inválidos semelhantes entre si;
- estabilidade de estado em trocas rápidas (`válido -> válido -> inválido`);
- consistência da limpeza em transições envolvendo conteúdo sensível;
- ausência de “estado fantasma” (metadado antigo persistindo na UI).

Fora de escopo nesta rodada: Android, Secure USB, integração completa com signer externo, fluxo watch-only ponta-a-ponta e expansão de QR por câmera.

## 2) Casos executados

### 2.1 Casos que passaram

- `ypub` válido -> detectado como `ypub`, classificação `estável`, rede `mainnet`.
- Troca rápida `xpub -> ypub -> lixo` -> UI atualizou corretamente em cada etapa, sem ficar presa em estado anterior.
- Quase-PSBT (`cHNidP8BAA`) -> classificado como `unknown`.
- Address com prefixo inválido (`bc9...`) -> classificado como `unknown`.
- Payload parecido com Lightning, mas inválido (`lnxyz123`) -> classificado como `unknown`.
- Transição `teste123 -> xpub válido -> seed válida` -> seed detectada com limpeza automática correta, sem metadado antigo residual.
- Sequência `lnbc1testinvoice123 -> teste123 -> limpar` -> comportamento coerente, sem aviso antigo sobrando.

### 2.2 Casos inconclusivos

- `zpub` foi testado com vetor **não garantido**; resultado observado `unknown`, sem base suficiente para concluir bug.

## 3) Bugs novos encontrados

- **Nenhum bug novo** foi identificado nesta rodada parcial.

## 4) Lições aprendidas

- O detector permaneceu robusto contra payloads “parecidos” porém inválidos.
- As transições entre fluxos não sensíveis e sensíveis permaneceram consistentes.
- O risco de regressão de estado (UI “presa” em detecção anterior) reduziu com evidência manual real.
- Casos inconclusivos precisam de vetores canônicos garantidos para evitar falso alarme.

## 5) Lacunas restantes

1. Validar `zpub` com vetor canônico garantido (positivo e negativo de checksum).
2. Expandir rede/testnet para endereços e chaves estendidas com vetores confiáveis.
3. Cobrir offline menos trivial (sequências de interação e limpeza, não apenas input simples).
4. Exercitar watch-only de forma mais profunda (ainda sem integração completa externa).
5. Expandir UX de erro/clareza para cenários de parsing com orientação acionável.
6. Acrescentar casos PSBT/signer-related de maior riqueza sem abrir integração ponta-a-ponta.

## 6) Recomendação da próxima rodada

Executar uma **rodada 3 funcional focada em lacunas reais**:

- `zpub` com vetor garantido;
- matriz adicional de rede/testnet;
- offline com fluxo mais completo de interação local;
- watch-only em profundidade controlada;
- clareza de UX de erro;
- PSBTs quase-válidas/limítrofes e comportamento de orientação na UI.

Objetivo da rodada 3: aumentar cobertura útil sem repetir casos já estáveis.
