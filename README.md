# Bitcoin Universal Recovery & Signing Hub (BURSH)

Estado atual: **base criptográfica validada para BIP39/BIP84, PSBT e BOLT11, com checks automatizados**.

Este repositório organiza módulos para recuperação Bitcoin, parsing de PSBT, parsing de invoice Lightning e detecção universal de payload QR.

## Setup de ambiente (sem dependência obrigatória de Corepack)

### Opção 1 (recomendada): pnpm

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

### Opção 2: npm

```bash
npm install
npm run build
npm run lint
npm run test
```

### Opção 3: yarn

```bash
yarn install
yarn build
yarn lint
yarn test
```

Se seu ambiente falhar com Corepack (erro 403), use instalação direta do gerenciador (sem Corepack) e rode os scripts acima.

## Situação por área

- `core-domain`: contratos TypeScript.
- `security-core`: utilitários de redaction e buffer wipe.
- `bitcoin-engine`: BIP39 com wordlist oficial (2048 palavras), checksum real e derivação BIP84 (`m/84'/0'/0'/0/0`) com endereço SegWit bech32.
- `psbt-engine`: validação estrutural BIP174 (global/inputs/outputs e consistências críticas).
- `qr-engine`: detecção universal com validação completa de endereço Bech32/Bech32m e Base58Check.
- `lightning-engine`: parser BOLT11 com validação de assinatura e integridade.
- `network-adapters`: adaptador HTTP para broadcast.
- `apps/web`: interface React.
- `apps/android`: estrutura documental.

## Política de dados sensíveis

Permitido persistir:
- xpub/ypub/zpub
- preferências de UI

Não persistir:
- mnemonic
- passphrase
- seed
- chaves privadas

## Observação crítica de segurança

Em JavaScript/TypeScript, limpeza de memória é limitada por:
- garbage collector não determinístico;
- strings imutáveis;
- cópias internas feitas pelo runtime.

Por isso, `wipe()` em `Uint8Array` reduz exposição, mas **não garante eliminação criptográfica absoluta**.
