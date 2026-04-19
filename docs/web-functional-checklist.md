# Web functional checklist (manual)

Atualizado em: **2026-04-19**.

Objetivo: validar o comportamento funcional **real** do app `apps/web` rodando localmente, com foco em detecção de payload e limpeza de sensíveis, antes da próxima rodada de evolução de produto.

## Pré-condições

1. Instalar dependências e subir o app web:
   - `pnpm install`
   - `pnpm --filter web dev` (ou `pnpm dev` no monorepo)
2. Abrir a URL local do Vite (ex.: `http://localhost:5173`).
3. Executar os testes em ambiente limpo (aba anônima e sem extensões de injeção de script).
4. Para casos com dados sensíveis, usar payloads de laboratório (nunca seed real).

## Limites conhecidos do escopo atual

- A validação é majoritariamente local e sintática: o app detecta tipo de payload, **não** executa fluxo transacional completo.
- Lightning invoice é detectada por prefixo (`lnbc`/`lntb`) e pode aceitar entradas truncadas que mantenham prefixo válido.
- Não há persistência proposital de payload sensível em storage local (escopo RAM-only de UI).
- Não há integração obrigatória com backend para concluir os casos desta checklist.

## Matriz de validação funcional

| ID    | Cenário                          | Passos                                                                                         | Resultado esperado                                                                                                                               | Dependências / limites                                                                                 |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| WF-01 | Abrir home                       | Entrar na URL local.                                                                           | Título "Bitcoin Universal Recovery & Signing Hub", painel "Entrada Universal via QR", textarea e cards de ação renderizados sem erro de runtime. | Navegador moderno com JS habilitado.                                                                   |
| WF-02 | Renderização base da UI          | Redimensionar viewport desktop/móvel e recarregar página.                                      | Conteúdo principal permanece visível; textarea utilizável; botão "Limpar payload da memória" acessível.                                          | Teste visual/manual (sem baseline automatizado).                                                       |
| WF-03 | Estado inicial de detecção       | Abrir a tela e não inserir input.                                                              | Mensagem de estado exibe "aguardando entrada"; nenhum tipo detectado ou erro visível.                                                            | Depende da UI atual de status.                                                                         |
| WF-04 | Limpeza manual (botão principal) | Digitar qualquer texto no textarea e clicar "Limpar payload da memória".                       | Campo volta para vazio; tipo detectado/erro/notificação de sensível deixam de aparecer.                                                          | Resultado esperado é reset completo do estado da tela.                                                 |
| WF-05 | xpub válido                      | Colar um xpub válido.                                                                          | UI exibe estado de payload reconhecido e `Tipo detectado: xpub`.                                                                                 | Aceita também ypub/zpub com o tipo correspondente.                                                     |
| WF-06 | xpub inválido                    | Alterar 1 caractere de um xpub válido e colar.                                                 | UI não deve classificar como xpub/ypub/zpub; esperado `Tipo detectado: unknown`.                                                                 | Foco em não-falso-positivo.                                                                            |
| WF-07 | Seed válida (BIP39)              | Colar mnemonic BIP39 válida (12/15/18/21/24 palavras EN).                                      | UI mostra `Tipo detectado: bip39`; exibe aviso de sensível; campo de entrada é limpo automaticamente.                                            | Usar seed de teste.                                                                                    |
| WF-08 | Seed inválida                    | Colar frase com contagem errada ou checksum inválido.                                          | Não deve classificar como `bip39`; esperado `unknown`; campo **não** deve ser limpo automaticamente.                                             | Depende da validação BIP39 local.                                                                      |
| WF-09 | PSBT válida                      | Colar PSBT válida em base64, hex (`70736274ff...`) ou `ur:crypto-psbt/...`.                    | UI mostra `Tipo detectado: psbt`; exibe aviso de sensível; campo de entrada é limpo automaticamente.                                             | Validação atual checa magic bytes/formato.                                                             |
| WF-10 | PSBT inválida                    | Colar texto semelhante sem magic bytes correta ou base64 malformado.                           | Não deve classificar como `psbt`; esperado `unknown`; não exibir aviso de limpeza sensível.                                                      | Foco em evitar falso positivo por formato parcial.                                                     |
| WF-11 | Lightning invoice válida         | Colar invoice com prefixo `lnbc` ou `lntb`.                                                    | UI exibe `Tipo detectado: lightning_invoice`.                                                                                                    | Heurística por prefixo (não valida semântica completa da invoice).                                     |
| WF-12 | Lightning invoice inválida       | Colar string com prefixo incorreto (ex.: `lnxx...`) ou texto arbitrário.                       | UI não deve classificar como lightning; esperado `unknown`.                                                                                      | Caso truncado com `lnbc` pode passar pela heurística atual (limite conhecido).                         |
| WF-13 | Bitcoin address válida           | Colar endereço válido (Bech32 `bc1...`/`tb1...` ou Base58 `1...`/`3...`/`m...`/`n...`/`2...`). | UI exibe `Tipo detectado: bitcoin_address`; quando disponível, mostra metadado de rede (`mainnet`/`testnet`).                                    | Sem validação de script/uso em rede, apenas validação de formato/checksum suportado pelo parser local. |
| WF-14 | Bitcoin address inválida         | Colar endereço com checksum inválido, caracteres fora do alfabeto ou prefixo inválido.         | Não deve classificar como `bitcoin_address`; esperado `unknown`.                                                                                 | Cobrir ao menos 1 caso inválido Base58 e 1 inválido Bech32.                                            |
| WF-15 | Resiliência de parsing           | Inserir payload com caracteres incomuns, múltiplas linhas e espaços extras.                    | App não crasha; UI mantém estado consistente (detecta tipo ou `unknown`); ausência de erro de runtime no console.                                | Parsing exceptions hoje são raras; verificar principalmente estabilidade de UI.                        |
| WF-16 | Offline-first (sem internet)     | Com app já carregado, desligar rede do host e repetir WF-04 a WF-14.                           | Fluxos de detecção local continuam funcionando; não há dependência obrigatória de backend remoto para detectar payloads.                         | Pode exigir cache prévio dos assets da página para recarregar offline.                                 |

## Evidências mínimas por execução

Para cada execução, registrar:

- data/hora;
- ambiente (SO, navegador, versão do Node/pnpm);
- payload usado (mascarado quando sensível);
- resultado (pass/fail);
- captura de erro quando houver divergência.

## Critério de conclusão desta etapa

Esta etapa é considerada concluída quando:

1. WF-01..WF-16 tiverem evidência documentada;
2. falhas abertas virarem issues objetivas (com payload de reprodução);
3. resultados estiverem refletidos no plano funcional da próxima fase.
