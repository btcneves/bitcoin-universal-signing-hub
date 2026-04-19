# Web app — expected results by checklist case

Atualizado em: **2026-04-19**.

Este guia complementa a checklist funcional e descreve o comportamento esperado da UI atual (`apps/web`) com referência direta aos IDs da checklist (`WF-*`).

## Atualização pós rodadas manuais parciais (2026-04-19)

- Esta matriz incorpora evidência real das rodadas manuais parciais 1, 2 e 3.
- Bugs reais observados e corrigidos durante a rodada 1: falso positivo para PSBT truncada e falso positivo para endereço Bech32 inválido.
- Na rodada 2, não surgiram bugs novos e houve reforço de estabilidade em transições rápidas de estado.
- Na rodada 3 (parcial), não surgiram bugs novos; houve reforço de robustez em payloads inválidos “parecidos” e de consistência de estado/UI em sequências mistas e cenário offline local.
- Caso `zpub` permanece inconclusivo quando testado com vetor não garantido; não classificar como bug sem vetor canônico.
- Vetor Bech32 válido de referência para regressão: `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`.
- O vetor `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080` não deve ser marcado como válido neste documento.

## Convenções

- **Deve acontecer**: comportamento esperado para considerar o caso aprovado.
- **Não deve acontecer**: comportamento considerado bug/regressão.
- **Maturidade**: estável / heurístico / experimental (deve bater com checklist e UI).

## Matriz de resultados esperados

| Caso       | Maturidade   | Deve acontecer                                                                                                                                                                 | Não deve acontecer                                     |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| **WF-A01** | Estável      | Home carrega com título, painel de entrada, textarea, botão de limpeza e cards de ação.                                                                                        | Quebra visual crítica ao abrir app.                    |
| **WF-A02** | Estável      | Sem input: `Estado da entrada: vazia` e `Estado da detecção: aguardando entrada`.                                                                                              | Estado inicial inconsistente ou erro sem interação.    |
| **WF-A03** | Estável      | Com texto genérico: entrada vira `preenchida`; app continua responsivo; sem crash.                                                                                             | Travamento ou crash ao digitar texto simples.          |
| **WF-A04** | Estável      | Limpeza manual com conteúdo: apaga input, reseta detecção/erro e mostra feedback `Payload removido da área de teste manual.`                                                   | Input visível permanecer após limpar.                  |
| **WF-A05** | Estável      | Limpeza com campo vazio mostra feedback `Área de teste já estava limpa.`                                                                                                       | Sem feedback de ação ao limpar vazio.                  |
| **WF-B01** | Estável      | xpub/ypub/zpub válido detectado corretamente; `Classificação da detecção: estável`.                                                                                            | Classificar payload válido como `unknown`.             |
| **WF-B02** | Estável      | xpub/ypub/zpub inválido detectado como `unknown`.                                                                                                                              | Falso positivo como xpub/ypub/zpub válido.             |
| **WF-B03** | Estável      | Seed válida detectada como `bip39`; aviso de sensível exibido; campo limpo automaticamente.                                                                                    | Seed permanecer visível após detecção válida.          |
| **WF-B04** | Estável      | Seed inválida detectada como `unknown`; sem limpeza automática de sensível.                                                                                                    | Classificação incorreta como `bip39`.                  |
| **WF-B05** | Estável      | PSBT válida detectada como `psbt`; aviso de sensível exibido; campo limpo automaticamente.                                                                                     | PSBT válida ficar visível no campo após detecção.      |
| **WF-B06** | Estável      | PSBT inválida detectada como `unknown`; sem aviso de sensível.                                                                                                                 | Falso positivo como `psbt`.                            |
| **WF-B07** | Heurístico   | Invoice válida (`lnbc`/`lntb`) detectada como `lightning_invoice`; aviso heurístico visível; classificação `heurístico`.                                                       | Ocultar limitação heurística para Lightning.           |
| **WF-B08** | Heurístico   | Prefixo inválido (`lnxx` etc.) detectado como `unknown` (inclui casos como `lnxyz123`).                                                                                        | Classificar prefixo não suportado como invoice válida. |
| **WF-B09** | Estável      | Endereço válido detectado como `bitcoin_address`; quando houver, exibir `Rede detectada: mainnet/testnet` (referência canônica: `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`). | Falso negativo para exemplos válidos comuns.           |
| **WF-B10** | Estável      | Endereço inválido detectado como `unknown` (inclui prefixos inválidos como `bc9...` e vetores anteriormente reportados como falso positivo).                                   | Falso positivo para checksum/prefixo inválido.         |
| **WF-B11** | Experimental | Conteúdo multi-linha com ruído não trava app; estado mantém coerência (`tipo válido` ou `unknown`).                                                                            | Crash/congelamento por input ruidoso.                  |
| **WF-C01** | Estável      | Quando há erro de parsing, UI mostra mensagem objetiva com orientação: `Revise formato e conteúdo`.                                                                            | Erro silencioso ou mensagem sem contexto.              |
| **WF-C02** | Experimental | Com app já carregado, fluxos locais seguem sem backend obrigatório mesmo offline.                                                                                              | Dependência indevida de internet para fluxos locais.   |

## Regras transversais obrigatórias

1. **Tipos sensíveis com limpeza automática**: somente `bip39` e `psbt`.
2. **Sem persistência local de sensíveis**: sem gravação em LocalStorage/SessionStorage pelo app.
3. **Classificação de maturidade na UI**:
   - `estável` para tipos consolidados
   - `heurístico` para `lightning_invoice`
   - `não aplicável` para `unknown`
4. **Sem estado residual em transições**: troca rápida entre payloads deve refletir apenas o estado atual, sem aviso/metadado antigo sobrando.

## Resumo de maturidade atual

- **Estável com boa evidência manual**: Fluxos A (exceto A05 pendente de reforço), B01-B06, B09-B10 e transições rápidas de estado validadas/revalidadas nas rodadas 2 e 3.
- **Heurístico/experimental**: WF-B07, WF-B08, WF-B11, WF-C02.
- **Inconclusivo por vetor não garantido**: `zpub` em WF-B01 (não tratar como bug sem vetor confiável).
- **Fora do escopo desta fase**: watch-only completo, assinatura externa real, QR avançado ponta-a-ponta.
