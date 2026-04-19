# Web app — expected results by checklist case

Atualizado em: **2026-04-19**.

Este guia complementa a checklist funcional e descreve o comportamento esperado da UI atual (`apps/web`) com referência direta aos IDs da checklist (`WF-*`).

## Convenções

- **Deve acontecer**: comportamento esperado para considerar o caso aprovado.
- **Não deve acontecer**: comportamento considerado bug/regressão.
- **Maturidade**: estável / heurístico / experimental (deve bater com checklist e UI).

## Matriz de resultados esperados

| Caso       | Maturidade   | Deve acontecer                                                                                                               | Não deve acontecer                                     |
| ---------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **WF-A01** | Estável      | Home carrega com título, painel de entrada, textarea, botão de limpeza e cards de ação.                                      | Quebra visual crítica ao abrir app.                    |
| **WF-A02** | Estável      | Sem input: `Estado da entrada: vazia` e `Estado da detecção: aguardando entrada`.                                            | Estado inicial inconsistente ou erro sem interação.    |
| **WF-A03** | Estável      | Com texto genérico: entrada vira `preenchida`; app continua responsivo; sem crash.                                           | Travamento ou crash ao digitar texto simples.          |
| **WF-A04** | Estável      | Limpeza manual com conteúdo: apaga input, reseta detecção/erro e mostra feedback `Payload removido da área de teste manual.` | Input visível permanecer após limpar.                  |
| **WF-A05** | Estável      | Limpeza com campo vazio mostra feedback `Área de teste já estava limpa.`                                                     | Sem feedback de ação ao limpar vazio.                  |
| **WF-B01** | Estável      | xpub/ypub/zpub válido detectado corretamente; `Classificação da detecção: estável`.                                          | Classificar payload válido como `unknown`.             |
| **WF-B02** | Estável      | xpub/ypub/zpub inválido detectado como `unknown`.                                                                            | Falso positivo como xpub/ypub/zpub válido.             |
| **WF-B03** | Estável      | Seed válida detectada como `bip39`; aviso de sensível exibido; campo limpo automaticamente.                                  | Seed permanecer visível após detecção válida.          |
| **WF-B04** | Estável      | Seed inválida detectada como `unknown`; sem limpeza automática de sensível.                                                  | Classificação incorreta como `bip39`.                  |
| **WF-B05** | Estável      | PSBT válida detectada como `psbt`; aviso de sensível exibido; campo limpo automaticamente.                                   | PSBT válida ficar visível no campo após detecção.      |
| **WF-B06** | Estável      | PSBT inválida detectada como `unknown`; sem aviso de sensível.                                                               | Falso positivo como `psbt`.                            |
| **WF-B07** | Heurístico   | Invoice válida (`lnbc`/`lntb`) detectada como `lightning_invoice`; aviso heurístico visível; classificação `heurístico`.     | Ocultar limitação heurística para Lightning.           |
| **WF-B08** | Heurístico   | Prefixo inválido (`lnxx` etc.) detectado como `unknown`.                                                                     | Classificar prefixo não suportado como invoice válida. |
| **WF-B09** | Estável      | Endereço válido detectado como `bitcoin_address`; quando houver, exibir `Rede detectada: mainnet/testnet`.                   | Falso negativo para exemplos válidos comuns.           |
| **WF-B10** | Estável      | Endereço inválido detectado como `unknown`.                                                                                  | Falso positivo para checksum/prefixo inválido.         |
| **WF-B11** | Experimental | Conteúdo multi-linha com ruído não trava app; estado mantém coerência (`tipo válido` ou `unknown`).                          | Crash/congelamento por input ruidoso.                  |
| **WF-C01** | Estável      | Quando há erro de parsing, UI mostra mensagem objetiva com orientação: `Revise formato e conteúdo`.                          | Erro silencioso ou mensagem sem contexto.              |
| **WF-C02** | Experimental | Com app já carregado, fluxos locais seguem sem backend obrigatório mesmo offline.                                            | Dependência indevida de internet para fluxos locais.   |

## Regras transversais obrigatórias

1. **Tipos sensíveis com limpeza automática**: somente `bip39` e `psbt`.
2. **Sem persistência local de sensíveis**: sem gravação em LocalStorage/SessionStorage pelo app.
3. **Classificação de maturidade na UI**:
   - `estável` para tipos consolidados
   - `heurístico` para `lightning_invoice`
   - `não aplicável` para `unknown`

## Resumo de maturidade atual

- **Estável para rodada manual atual**: Fluxos A, B (exceto Lightning heurístico), C01.
- **Heurístico/experimental**: WF-B07, WF-B08, WF-B11, WF-C02.
- **Fora do escopo desta rodada**: watch-only completo, assinatura externa real, QR avançado ponta-a-ponta.
