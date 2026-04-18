# Bitcoin Universal Recovery & Signing Hub (BURSH)

Estado atual: **scaffold arquitetural inicial não validado**.

Este repositório organiza módulos para recuperação Bitcoin, parsing de PSBT, parsing de invoice Lightning e detecção universal de payload QR. O foco atual é estrutura inicial e testes básicos locais.

## Situação por área

- `core-domain`: contratos TypeScript (estrutura inicial).
- `security-core`: utilitários de redaction e buffer wipe (suporte parcial, não validado em produção).
- `bitcoin-engine`: parser básico BIP39 e derivação parcial BIP84 (não validado por revisão externa).
- `psbt-engine`: parser estrutural básico de mapas PSBT (suporte parcial).
- `qr-engine`: detector universal com inferência de tipos (suporte parcial).
- `lightning-engine`: parser básico BOLT11 (suporte parcial).
- `network-adapters`: adaptador HTTP para broadcast (não validado em ambiente real).
- `apps/web`: interface inicial React (não validado para uso operacional).
- `apps/android`: estrutura inicial documental.
- `secure-usb`: não presente neste snapshot.

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
