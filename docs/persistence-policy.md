# Política de Persistência e Telemetria

## Escopo

Esta política cobre todo fluxo de dados em `apps/web` e bibliotecas do monorepo.

## Dados que **nunca** podem ser persistidos

- mnemonic BIP39
- passphrase BIP39
- seed derivada
- private keys / WIF / xprv
- payload bruto de scanner contendo os itens acima

## Vetores bloqueados por lint

- `localStorage.setItem`
- `sessionStorage.setItem`
- `indexedDB.open`
- `caches.open` (Cache API)
- imports de `redux-persist`
- `persist` de `zustand/middleware`
- `localforage`
- `idb-keyval`
- serialização com `JSON.stringify` de identificadores de segredo

## Regras operacionais

1. Estado sensível deve existir apenas em memória local (`useState`, variáveis locais, buffers transitórios).
2. Fluxo watch-only (xpub/zpub/endereços) pode ser persistido no futuro, desde que separado de zona sensível.
3. Logs e telemetry devem usar redaction antes de serialização/transporte.
4. Erros devem ser apresentados com mensagens genéricas; nunca incluir payload original sensível.

## Limitações conhecidas

- ESLint reduz risco, mas não elimina risco total (ex.: eval dinâmico, dependências externas, builds sem lint).
- Limpeza em JavaScript depende de GC; wipe em `Uint8Array` é mitigação parcial.
