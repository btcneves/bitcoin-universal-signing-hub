# Política de persistência e telemetria

## Objetivo

Reduzir risco de exposição de dados sensíveis em armazenamento local, logs e transporte de telemetria.

## Dados que nunca podem ser persistidos

- mnemonic BIP39
- passphrase BIP39
- seed derivada
- private keys / WIF / xprv
- payload bruto que contenha qualquer item sensível

## Vetores bloqueados por regra de lint

- `localStorage.setItem`
- `sessionStorage.setItem`
- `indexedDB.open`
- `caches.open` (Cache API)
- `redux-persist`
- `persist` de `zustand/middleware`
- `localforage`
- `idb-keyval`
- serialização indevida de segredo (`JSON.stringify`)

## Regras operacionais

1. Dados sensíveis só podem existir em memória transitória.
2. Logs/telemetria devem aplicar redaction antes de qualquer serialização/transporte.
3. Mensagens de erro devem ser genéricas e sem eco de payload sensível.
4. Persistência futura de dados watch-only deve permanecer segregada de Zona 0.

## Limitações

- Lint reduz risco, mas não substitui revisão de arquitetura e testes de segurança.
- GC e semântica de memória em JavaScript impedem garantia forense total de wipe.

## Governança

Mudanças em fluxos de estado/telemetria devem atualizar este documento e o `docs/threat-model.md`.
