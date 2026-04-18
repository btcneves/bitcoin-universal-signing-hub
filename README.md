# Bitcoin Universal Recovery & Signing Hub (BURSH)

Foco atual: **reprodutibilidade, instalabilidade e validação auditável**.

## Versões suportadas

- Node.js `>=20.19 <23`
- pnpm `>=10.13.1`
- npm `>=10.0.0`

## Instalação e execução

### pnpm (preferencial)

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

### npm (fallback)

```bash
npm install --workspaces
npm run build
npm run lint
npm run test
```

### bootstrap automatizado npm

```bash
./scripts/bootstrap-npm.sh
```

## Estratégias de ambiente reproduzível

- Docker para dev/teste: `Dockerfile`
- Dev Container VS Code: `.devcontainer/devcontainer.json`
- Bootstrap fallback npm: `scripts/bootstrap-npm.sh`

Detalhes completos: `docs/reproducibility.md`.

## Segurança de persistência

A política de segurança foi ampliada para bloquear vetores persistentes (storage, IndexedDB, caches e bibliotecas de persistência de estado).

Detalhes: `docs/persistence-policy.md`.

## Módulos críticos auditáveis

Auditoria por módulo (BIP39, BIP32/BIP84, validação de endereço, PSBT e BOLT11): `docs/crypto-modules-audit.md`.

## Limitações conhecidas

Se `pnpm install`/`npm install` falhar com `403 Forbidden`, o ambiente está bloqueado por policy/proxy de rede e não por erro do código-fonte.
