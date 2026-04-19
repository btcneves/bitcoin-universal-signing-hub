# Auditoria consolidada da branch `main` (2026-04-18)

## 1) Árvore resumida atual

- `apps/`
  - `web/` (frontend Vite + React)
  - `android/` (README, sem implementação ativa)
- `packages/`
  - `bitcoin-engine/`, `psbt-engine/`, `qr-engine/`, `lightning-engine/`
  - `security-core/`, `core-domain/`, `shared-types/`, `ui/`, `network-adapters/`
- `scripts/`
  - `run-workspaces.mjs`
  - `bootstrap-npm.sh`
- `docs/` (arquitetura, auditorias e políticas)
- `.github/workflows/` (`ci.yml`, `security.yml`)
- `.devcontainer/` + `Dockerfile`
- `infra/usb/` (artefatos de kiosk/ISO)

## 2) Classificação por área (estado consolidado)

### Root tooling/scripts — **Parcial**

- Há scripts agregadores de workspace para build/lint/test/typecheck.
- Inconsistência detectada entre `workspaces` no `package.json` e `pnpm-workspace.yaml` (root não inclui `infra/*`, enquanto pnpm inclui).
- `Dockerfile` referencia arquivos de configuração não presentes com os nomes usados no `COPY`.

### apps/web — **Parcial**

- UI mínima funcional para detecção de payload QR.
- Fluxo de limpeza de input sensível existe (`bip39` e `psbt` limpam textarea).
- Dependência direta ausente para `@bursh/shared-types` mesmo com import direto no app.

### packages/bitcoin-engine — **Funcional (estático), não validado runtime completo**

- Implementa validação BIP39, seed BIP39 e derivação BIP84/xpub/zpub/endereço.
- Testes com vetor conhecido existem, mas validação final depende de execução completa em ambiente com dependências íntegras.

### packages/psbt-engine — **Parcial**

- Implementa decode e validação estrutural mínima de PSBT + adaptação QR.
- `finalizePsbt` não finaliza transação de fato; retorna somente resumo textual.

### packages/qr-engine — **Parcial**

- Detecta BIP39, xpub/ypub/zpub, invoice LN, PSBT e endereço BTC.
- Regra BIP39 por contagem de palavras pode gerar falso positivo sem checksum.
- Heurística de PSBT em base64 aceita qualquer payload iniciando magic bytes, sem validação estrutural total.

### packages/lightning-engine — **Parcial**

- Parseia BOLT11 e rejeita invoice inválida.
- Sem execução de pagamento/roteamento, apenas parsing.

### packages/security-core — **Estrutural**

- Redação de logs e wipe de memória sensível estão presentes.
- Não há integração obrigatória com todos os módulos (uso é opcional por design atual).

### network-adapters — **Não validado**

- Adapter de broadcast usa `fetch` HTTP POST, mas não há testes de integração com endpoint real.

### docs — **Estrutural**

- Existe documentação de arquitetura, reprodutibilidade, política de persistência e auditoria dos módulos críticos.

### CI/workflows — **Parcial**

- Pipeline cobre lint/typecheck/test/build e security scan.
- Versão de pnpm no CI (9) diverge da versão declarada no projeto (10.13.1).

### Docker/devcontainer/bootstrap — **Bloqueado por ambiente / Parcial**

- Base existe, mas Dockerfile deve falhar no `COPY` devido a nomes de arquivo inexistentes.
- Script bootstrap npm roda checks completos, mas depende de instalação de pacotes no ambiente externo.

## 3) Problemas estáticos objetivos encontrados

1. `Dockerfile` copia `.eslintrc.cjs` e `.prettierrc`, mas o repositório usa `eslint.config.cjs` e não possui `.prettierrc`.
2. CI configura `pnpm` v9, enquanto `packageManager` e engines pedem série 10.
3. `apps/web` importa `@bursh/shared-types` diretamente, sem declarar essa dependência em `apps/web/package.json`.
4. `packages/ui` usa React + JSX, mas não declara `@types/react` (e possivelmente `@types/react-dom`) em `devDependencies`; typecheck/build falham.
5. `package.json` root lista `workspaces` (`apps/*`, `packages/*`), mas `pnpm-workspace.yaml` inclui também `infra/*`; pode gerar comportamento diferente entre npm e pnpm.
6. `apps/web/src/App.test.ts` usa string truncada (`xpub6CUGRUon...`) e espera tipo `xpub`; heurística atual exige chave válida com checksum.
7. `psbt-engine` chama método `finalizePsbt`, porém retorna metadado textual em vez de PSBT/tx finalizada.
8. `qr-engine` classifica mnemonic apenas por número de palavras, sem validar checksum BIP39 naquele ponto.

## 4) Estado dos módulos críticos (main atual)

### BIP39

- Implementado: validação e derivação seed PBKDF2-HMAC-SHA512.
- Depende de runtime: execução de vetores adicionais e compatibilidade browser/node final.
- Incompleto: geração segura de mnemonic no app e fluxo E2E web.
- Risco de uso incorreto: baixa no engine; moderada no UX se QR detector tratar texto 12/24 palavras como bip39 sem checksum.

### BIP32/BIP84

- Implementado: derivação `m/84'/0'/account'`, conversão xpub↔zpub e derivação endereço p2wpkh.
- Depende de runtime: validação cruzada em testnet/mainnet e vetores ampliados.
- Incompleto: cobertura de variantes de rede e account edge-cases.
- Risco: moderado (usuário pode assumir suporte amplo de redes/paths não implementados).

### Validação de endereço BTC

- Implementado: base58check + bech32/bech32m com checks básicos de witness.
- Depende de runtime: corpus amplo de endereços inválidos/maliciosos.
- Incompleto: regras avançadas para todos cenários futuros/network custom.
- Risco: moderado.

### PSBT

- Implementado: decode base64/hex + validação estrutural mínima.
- Depende de runtime: assinatura/finalização real e integração com signer.
- Incompleto: finalização real de PSBT/transação, políticas de fee/sighash/script.
- Risco: alto de interpretação incorreta por usuário final se `finalizePsbt` for entendido como finalização real.

### BOLT11

- Implementado: parsing + validação de integridade via biblioteca.
- Depende de runtime: cobertura com invoices reais de múltiplos emissores.
- Incompleto: pagamento lightning (somente parse).
- Risco: baixo a moderado (desde que UX deixe claro que não paga invoices).

### Detecção QR

- Implementado: roteamento por tipo para payloads principais.
- Depende de runtime: testes com câmera, ruído, fragmentação multi-frame.
- Incompleto: validação forte em todos tipos detectados.
- Risco: moderado por falso positivo (especialmente bip39 e psbt heurístico).

### Políticas de persistência e logging

- Implementado: regras lint restritivas + redaction em `security-core`.
- Depende de runtime: verificação de que todos pontos de log reais passam por logger seguro.
- Incompleto: enforcement arquitetural (obrigatoriedade de uso do logger seguro).
- Risco: moderado.

## 5) Comandos mínimos para validação externa

1. `corepack enable`
2. `pnpm install --frozen-lockfile=false`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm build`

Versões recomendadas no host externo:

- Node `22.21.1` (compatível com `.nvmrc` e engines)
- pnpm `10.13.1`
- npm `>=10` (fallback)

## 6) Ajustes de CI sugeridos

1. Alinhar `pnpm/action-setup` para `version: 10.13.1`.
2. Adicionar job que valide build Docker (ou ao menos `docker build` do `Dockerfile`) para detectar `COPY` quebrado.
3. Opcional: separar smoke-tests por pacote para facilitar diagnóstico de falha.

## 7) Prioridade técnica sugerida

### P0 (imediato)

- Corrigir `Dockerfile` (arquivos copiados inexistentes).
- Corrigir `packages/ui/package.json` para tipagem React.
- Corrigir dependências diretas ausentes em `apps/web/package.json`.
- Alinhar versão de pnpm do CI com engines/packageManager.

### P1 (curto prazo)

- Ajustar teste `apps/web/src/App.test.ts` para usar xpub válido.
- Tornar explícito no domínio/UX que `finalizePsbt` atual é apenas validação/resumo.

### P2 (médio prazo)

- Endurecer detector QR para validar mnemonic BIP39 por checksum antes de classificar como `bip39`.
- Expandir cobertura de testes de rede, endereços e invoices reais.
