# Web functional checklist (manual)

Atualizado em: **2026-04-19**.

Objetivo: executar validação funcional manual real do `apps/web` com evidência reutilizável para abertura de issues funcionais.

## Pré-condições gerais

1. Instalar dependências e subir o app web:
   - `pnpm install`
   - `pnpm --filter web dev` (ou `pnpm dev` no monorepo)
2. Abrir a URL local do Vite (ex.: `http://localhost:5173`).
3. Rodar em aba limpa (anônima, sem extensões que injetem script).
4. Para casos sensíveis, usar apenas payload de laboratório (nunca seed real).
5. Usar o template `docs/web-test-report-template.md` para evidência por caso.

## Atualização pós rodadas manuais parciais (2026-04-19)

- Evidência real já confirmou passagens dos casos: WF-A01, WF-A02, WF-A03, WF-A04 (incluindo limpeza após auto-clear), WF-B01 (xpub/ypub), WF-B02, WF-B03, WF-B04, WF-B05, WF-B06, WF-B07, WF-B08, WF-B09, WF-B10, WF-B11 e verificação offline básica relacionada ao WF-C02.
- Evidência da rodada 2 reforçou estabilidade de transições rápidas (`xpub -> ypub -> lixo`) e transições `não sensível -> sensível` sem metadado residual.
- Evidência da rodada 3 parcial reforçou:
  - `ypub` válido com estado estável/mainnet;
  - rejeição correta de payloads inválidos “parecidos” (`cHNidP8BAA`, `bc9...`, `lnxyz123`) como `unknown`;
  - consistência de estado nas sequências `teste123 -> xpub válido -> seed válida` e `lnbc1testinvoice123 -> teste123 -> limpar`;
  - continuidade coerente em cenário offline mais rico (local-only).
- Caso `zpub` permanece **inconclusivo** por ausência de vetor garantido na execução manual parcial.
- Para Bech32 válido canônico, usar explicitamente: `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`.
- O vetor `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080` não deve ser tratado como “válido” nesta checklist.

## Legenda de maturidade

- **Estável**: comportamento esperado e prioritário para regressão.
- **Heurístico**: comportamento parcial por regra de detecção simplificada.
- **Experimental**: comportamento ainda em maturação e sujeito a ajustes de UX/fluxo.

## Fluxo A — estado inicial, input e limpeza manual

| ID     | Maturidade | Caso                                | Passos                                                 | Resultado esperado                                                                                                | Resultado observado |
| ------ | ---------- | ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------- |
| WF-A01 | Estável    | Abrir home                          | Acessar URL local com app carregado.                   | Título principal, painel de entrada, textarea, botão de limpeza e cards de ação aparecem sem erro visual crítico. | ☐                   |
| WF-A02 | Estável    | Estado inicial                      | Abrir tela sem inserir dados.                          | UI mostra `Estado da entrada: vazia` e `Estado da detecção: aguardando entrada`.                                  | ☐                   |
| WF-A03 | Estável    | Input manual genérico               | Digitar texto curto (`teste 123`).                     | Estado da entrada vira `preenchida`; app segue responsivo; detecção não causa crash.                              | ☐                   |
| WF-A04 | Estável    | Limpeza manual com input preenchido | Inserir conteúdo e clicar `Limpar payload da memória`. | Campo é limpo; detecção e erros são resetados; mensagem de feedback de limpeza é exibida.                         | ☐                   |
| WF-A05 | Estável    | Limpeza manual sem input            | Com campo já vazio, clicar no botão de limpar.         | UI informa que a área já estava limpa (feedback visível).                                                         | ☐                   |

## Fluxo B — detecção por tipo de payload (válido e inválido)

| ID     | Maturidade   | Caso                        | Pré-condição específica                                                        | Passos                                               | Resultado esperado                                                      | Resultado observado |
| ------ | ------------ | --------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------- | ------------------- |
| WF-B01 | Estável      | xpub/ypub/zpub válido       | Ter payload válido de laboratório.                                             | Colar xpub (ou ypub/zpub).                           | `Tipo detectado` correspondente + `Classificação da detecção: estável`. | ☐                   |
| WF-B02 | Estável      | xpub inválido               | Partir de xpub válido e alterar checksum/caractere.                            | Colar versão inválida.                               | Não detectar como xpub/ypub/zpub (esperado: `unknown`).                 | ☐                   |
| WF-B03 | Estável      | Seed BIP39 válida           | Ter mnemonic de laboratório válida.                                            | Colar seed 12/15/18/21/24 palavras.                  | Detecta `bip39`; limpa input automaticamente; mostra aviso de sensível. | ☐                   |
| WF-B04 | Estável      | Seed inválida               | Seed com checksum/contagem incorreta.                                          | Colar seed inválida.                                 | Não detectar `bip39`; sem limpeza automática por sensível.              | ☐                   |
| WF-B05 | Estável      | PSBT válida                 | Ter exemplo válido (`base64`, `hex` ou `ur:crypto-psbt`).                      | Colar PSBT válida.                                   | Detecta `psbt`; limpa input automaticamente; mostra aviso de sensível.  | ☐                   |
| WF-B06 | Estável      | PSBT inválida               | Texto semelhante sem formato correto.                                          | Colar payload inválido.                              | Não detectar `psbt`; sem aviso de sensível.                             | ☐                   |
| WF-B07 | Heurístico   | Lightning válida            | Ter invoice com prefixo `lnbc` ou `lntb`.                                      | Colar invoice válida.                                | Detecta `lightning_invoice`; mostra aviso de limitação heurística.      | ☐                   |
| WF-B08 | Heurístico   | Lightning inválida          | Prefixo incorreto (`lnxx`) ou ruído.                                           | Colar payload inválido.                              | Não detectar `lightning_invoice` com prefixo inválido.                  | ☐                   |
| WF-B09 | Estável      | Address Bitcoin válida      | Endereço válido Bech32/Base58 de laboratório (preferir vetor canônico abaixo). | Colar `bc1.../tb1...` ou `1.../3.../m.../n.../2...`. | Detecta `bitcoin_address`; quando disponível, mostra rede detectada.    | ☐                   |
| WF-B10 | Estável      | Address Bitcoin inválida    | Alterar checksum/prefixo de exemplo válido.                                    | Colar endereço inválido.                             | Não detectar como `bitcoin_address`.                                    | ☐                   |
| WF-B11 | Experimental | Texto multi-linha com ruído | Preparar payload com quebras, espaços e símbolos incomuns.                     | Colar conteúdo no textarea.                          | App não trava; mantém estado coerente (tipo válido ou `unknown`).       | ☐                   |

## Fluxo C — erros e modo offline

| ID     | Maturidade   | Caso                        | Passos                                                                                       | Resultado esperado                                                    | Resultado observado |
| ------ | ------------ | --------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------- |
| WF-C01 | Estável      | Mensagem de erro de parsing | Induzir input que cause erro no parser (quando aplicável).                                   | UI mostra mensagem com contexto mínimo (“revise formato e conteúdo”). | ☐                   |
| WF-C02 | Experimental | Continuidade sem internet   | Com app carregado, desligar internet e repetir casos WF-A04, WF-B01, WF-B03, WF-B05, WF-B09. | Fluxos locais continuam funcionais sem backend obrigatório.           | ☐                   |

### Vetor recomendado para WF-B09 (Bech32 válido canônico)

- `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`

## Evidência mínima por caso

- Data/hora da execução.
- Ambiente (SO, navegador, Node, pnpm).
- Payload utilizado (mascarado quando sensível).
- Resultado esperado vs observado.
- Status: passou / falhou / parcial.
- Link para print/log/console quando houver divergência.

## Critério de conclusão desta etapa

1. Casos WF-A01..WF-C02 executados com evidência mínima.
2. Falhas relevantes registradas em issue com reprodução clara.
3. Priorização de bugs funcionais refletida no fluxo `docs/web-bug-reporting-flow.md` e no status do projeto.
4. Próxima rodada deve priorizar apenas casos ainda sem cobertura robusta (ex.: `zpub` garantido, rede/testnet adicional, watch-only/PSBT mais profundos e UX de erro acionável).
