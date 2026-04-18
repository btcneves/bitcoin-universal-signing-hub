# Architecture

Estado de referência: **scaffold arquitetural inicial não validado**.

## Zonas de segurança

- **Zona 0 (somente memória de processo):** mnemonic BIP39, passphrase, seed, material privado transitório.
- **Zona 1 (privado não crítico):** xpub/ypub/zpub, preferências locais.
- **Zona 2 (rede):** adapters de broadcast e integrações remotas.

Regra de separação: Zona 2 não deve receber objetos de Zona 0.

## Módulos

- `packages/core-domain`: contratos de serviço e tipos de fronteira.
- `packages/security-core`: redaction de logs, assertions e wipe básico de buffers.
- `packages/bitcoin-engine`: parser básico BIP39, derivação parcial BIP84 e geração de endereço bech32.
- `packages/psbt-engine`: detector de mágico `psbt\xff` e parse estrutural de mapas.
- `packages/lightning-engine`: parsing básico de invoice BOLT11.
- `packages/qr-engine`: detector universal (bip39/xpub-ypub-zpub/psbt/address/lightning).
- `packages/network-adapters`: adapter HTTP de broadcast.
- `apps/web`: UI inicial para inspeção de payloads.
- `apps/android`: estrutura inicial documental.

## Limites de memória em JavaScript

Mesmo com `Uint8Array.fill(0)`, ainda existem riscos:
- GC não determinístico;
- imutabilidade de strings;
- buffers temporários fora de controle da aplicação.

Conclusão: wipe local é mitigação parcial; não é garantia total de eliminação forense.
