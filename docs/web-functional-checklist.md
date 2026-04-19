# Web functional checklist (manual)

Atualizado em: **2026-04-19**.

Objetivo: validar o comportamento funcional **real** do app `apps/web` rodando localmente, antes de abrir novas frentes de feature.

## Pré-condições

1. Instalar dependências e subir app web:
   - `pnpm install`
   - `pnpm --filter web dev` (ou `pnpm dev` no monorepo)
2. Abrir a URL local do Vite (ex.: `http://localhost:5173`).
3. Executar os testes em ambiente limpo (aba anônima e sem extensões de injeção de script).

## Matriz de validação funcional

| ID    | Cenário                                    | Passos                                                                                             | Resultado esperado                                                                                                                               |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| WF-01 | Abrir home                                 | Entrar na URL local.                                                                               | Título "Bitcoin Universal Recovery & Signing Hub", painel "Entrada Universal via QR", textarea e cards de ação renderizados sem erro de runtime. |
| WF-02 | Renderização base da UI                    | Redimensionar viewport desktop/móvel e recarregar página.                                          | Conteúdo principal permanece visível, textarea utilizável e botão "Limpar payload da memória" acessível.                                         |
| WF-03 | Botão principal (limpar)                   | Digitar qualquer texto no textarea e clicar "Limpar payload da memória".                           | Campo volta para vazio; tipo detectado/erro anterior não permanece visível.                                                                      |
| WF-04 | Detecção manual de payload (xpub válido)   | Colar um xpub válido.                                                                              | UI exibe `Tipo detectado: xpub`.                                                                                                                 |
| WF-05 | Detecção manual de payload (xpub inválido) | Alterar 1 caractere de um xpub válido e colar.                                                     | UI exibe `Tipo detectado: unknown` (não deve classificar como xpub).                                                                             |
| WF-06 | Seed válida (BIP39)                        | Colar mnemonic BIP39 válida (12/15/18/21/24 palavras EN).                                          | UI exibe `Tipo detectado: bip39`; após detectar, textarea é limpo automaticamente (fluxo sensível).                                              |
| WF-07 | Seed inválida                              | Colar frase com contagem errada ou checksum inválido.                                              | Não deve classificar como `bip39`; esperado `unknown`.                                                                                           |
| WF-08 | PSBT válida                                | Colar PSBT válida em base64, hex (com magic `70736274ff`) ou `ur:crypto-psbt/...`.                 | UI exibe `Tipo detectado: psbt`; após detectar, textarea é limpo automaticamente (fluxo sensível).                                               |
| WF-09 | PSBT inválida                              | Colar texto semelhante sem magic bytes correta ou base64 malformado.                               | Não deve classificar como `psbt`; esperado `unknown`.                                                                                            |
| WF-10 | Lightning invoice válida                   | Colar invoice com prefixo `lnbc` ou `lntb`.                                                        | UI exibe `Tipo detectado: lightning_invoice`.                                                                                                    |
| WF-11 | Lightning invoice inválida                 | Colar string parecida (prefixo errado ou truncada).                                                | Não deve classificar como `lightning_invoice`; esperado `unknown`.                                                                               |
| WF-12 | Mensagens de erro de parsing               | Inserir payload com caracteres de controle/entrada quebrada em múltiplas linhas.                   | App não crasha; se houver exceção no parser, UI mostra `Falha ao processar payload (...)`.                                                       |
| WF-13 | Limpeza de dados sensíveis em UI/estado    | Colar seed válida e PSBT válida; em seguida observar textarea e DevTools React (quando aplicável). | Campo deve ser limpo automaticamente para tipos `bip39` e `psbt`; não deve haver persistência em storage local pelo app.                         |
| WF-14 | Comportamento sem internet (offline-first) | Com app já carregado, desligar rede do host e repetir WF-03..WF-11.                                | Fluxos de detecção local continuam funcionando (sem chamadas obrigatórias de backend remoto).                                                    |

## Evidências sugeridas por execução

Para cada execução, registrar:

- data/hora;
- ambiente (SO, navegador, versão do Node/pnpm);
- payload usado (mascarado quando sensível);
- resultado (pass/fail);
- captura de erro quando houver divergência.

## Critério de conclusão desta etapa

Esta etapa é considerada concluída quando:

1. WF-01..WF-14 tiverem evidência documentada;
2. falhas abertas virarem issues objetivas (com payload de reprodução);
3. `docs/project-status.md` e `docs/roadmap.md` estiverem alinhados ao resultado real da validação.
