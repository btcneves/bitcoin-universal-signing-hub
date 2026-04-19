# Arquitetura

Documento de referência arquitetural do BURSH no estado atual (abril/2026).

## Visão geral

O monorepo é organizado para separar:

- **domínio e segurança** (bibliotecas em `packages/*`),
- **interfaces de execução** (`apps/*`),
- **políticas e governança técnica** (`docs/*`).

A arquitetura prioriza fluxo **offline-first** e minimização de persistência de dados sensíveis.

## Zonas de segurança

- **Zona 0 (sensível / memória de processo):** mnemonic, passphrase, seed e material privado transitório.
- **Zona 1 (privado não crítico):** xpub/ypub/zpub, metadados watch-only e preferências locais controladas.
- **Zona 2 (rede):** adapters de broadcast e integrações externas.

**Regra central:** dados de Zona 0 não devem atravessar para Zona 2.

## Módulos principais

- `packages/core-domain`: contratos de serviço e tipos de fronteira.
- `packages/security-core`: redaction de logs, assertivas e wipe básico de buffers.
- `packages/bitcoin-engine`: validação BIP39, derivação BIP84 e endereço segwit.
- `packages/psbt-engine`: parse/validação estrutural de PSBT.
- `packages/lightning-engine`: parsing e validação de BOLT11.
- `packages/qr-engine`: detecção de tipo de payload para roteamento seguro.
- `packages/network-adapters`: adapters HTTP para integrações de rede.
- `apps/web`: interface atual para inspeção e fluxo local.
- `apps/android`: trilha reservada para evolução futura.

## Decisões arquiteturais já consolidadas

1. Monorepo com workspaces para isolar fronteiras de domínio e reduzir acoplamento.
2. Segurança por política + lint + contratos de módulo (não só por convenção de UI).
3. Uso de bibliotecas consolidadas para primitives criptográficas (em vez de implementação manual).
4. Estratégia incremental: primeiro robustez estática e reprodutibilidade, depois validação funcional em ambiente real.

## Limites técnicos conhecidos

Mesmo com limpeza de buffers (`Uint8Array.fill(0)`), JavaScript continua sujeito a:

- GC não determinístico;
- cópias implícitas/imutabilidade de strings;
- artefatos temporários fora de controle estrito da aplicação.

Conclusão: wipe local é mitigação parcial, não garantia forense total.
