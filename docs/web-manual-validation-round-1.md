# Web manual validation — rodada 1 (parcial)

Atualizado em: **2026-04-19**.

## 1) Escopo da rodada

Rodada manual **parcial** focada no comportamento atual da home web (`apps/web`) para:

- renderização inicial e estados básicos de UI;
- detecção de payload no textarea (válidos e inválidos);
- limpeza manual e auto-limpeza para payload sensível;
- robustez com input ruidoso/multilinha;
- verificação básica de continuidade local sem travamento.

Fora de escopo nesta rodada: fluxo watch-only completo, assinatura externa real, Android e Secure USB.

## 2) Casos executados e resultado consolidado

### 2.1 Casos que passaram

- Home / estado inicial renderizando corretamente.
- Texto genérico -> `unknown`.
- Texto multilinha genérico -> `unknown`.
- Seed BIP39 válida -> detecta `bip39`, classifica `estável`, e limpa automaticamente.
- Seed BIP39 inválida -> `unknown`.
- xpub válido real -> detecta `xpub`, `estável`, `mainnet`.
- xpub inválido -> `unknown`.
- Texto parecido com xpub (`xpub-lixo-123`) -> `unknown`.
- xpub válido com whitespace periférico -> segue detectando corretamente.
- Lightning truncado/heurístico (`lnbc123`, `lnbc1testinvoice123`) -> `lightning_invoice`, `heurístico`, com aviso explícito.
- PSBT válida -> detecta `psbt`, `estável`, e limpa automaticamente.
- Endereço Bech32 válido canônico (`bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`) -> `bitcoin_address`, `estável`, `mainnet`.
- Limpeza manual após auto-clear sensível -> comportamento coerente.
- Teste básico offline com `teste123` -> UI funcional e `unknown`.

### 2.2 Bugs reais encontrados e corrigidos durante a rodada

1. **Falso positivo de PSBT truncada**
   - Sintoma observado: payload incompleto era classificado como `psbt`.
   - Estado atual após correção: caso agora retorna `unknown`.

2. **Falso positivo de endereço Bech32 inválido**
   - Sintoma observado: endereço inválido era aceito como `bitcoin_address`.
   - Estado atual após correção: caso agora retorna `unknown`.

## 3) Casos esclarecidos (não-bug)

- O vetor `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080` **não** deve ser tratado como válido no estado atual da implementação.
- O vetor canônico aceito nesta rodada manual é `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`.

## 4) Lições aprendidas

- A rodada manual inicial já foi suficiente para capturar falsos positivos reais em parsing/detecção.
- Validar com payload inválido próximo do formato correto é essencial para reduzir regressão silenciosa.
- A classificação de maturidade (`estável` vs `heurístico`) está útil para alinhar expectativa de QA e produto.
- A limpeza automática em conteúdo sensível está funcionando como proteção de base e deve continuar coberta em regressão.

## 5) Pendências restantes para próxima rodada

- Expandir cobertura de watch-only (casos mais profundos e negativos).
- Ampliar matriz de PSBT (formatos limite, ruído, payload quase-válido adicional).
- Ampliar validação address/network (mainnet/testnet e negativos adicionais).
- Exercitar UX de erro/feedback em mais cenários.
- Exercitar offline em fluxos menos triviais (não apenas input simples).

## 6) Decisão de avanço

A fase sai de “preparação” para **expansão de validação funcional guiada por evidência real**, preservando foco no web app e sem abrir frentes grandes fora do escopo.
