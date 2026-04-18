# Reprodutibilidade de Ambiente

## Versões obrigatórias

- Node.js: `>=20.19 <23`
- pnpm: `>=10.13.1`
- npm: `>=10.0.0`

As versões são reforçadas em `package.json` via `engines` e `packageManager`.

## Estratégias suportadas

### Opção A — Docker

```bash
docker build -t bursh-dev .
docker run --rm -it bursh-dev pnpm test
```

### Opção B — Devcontainer

- Abra o repositório no VS Code com extensão Dev Containers.
- O container usa o `Dockerfile` do projeto e executa `pnpm install` no `postCreateCommand`.

### Opção C — Bootstrap com npm (fallback)

```bash
./scripts/bootstrap-npm.sh
```

Este script valida a versão de Node, instala workspaces com npm e executa build/lint/test.

## Lockfile e instalação previsível

- Em ambientes com acesso ao registry liberado:
  - `pnpm install` para gerar `pnpm-lock.yaml`.
  - `npm install --package-lock-only --workspaces` para gerar `package-lock.json`.
- Em CI, usar instalação frozen (`pnpm install --frozen-lockfile` ou `npm ci`).

## Bloqueio conhecido neste ambiente

No ambiente atual, o proxy retorna `403 Forbidden` para `registry.npmjs.org`, impedindo gerar lockfiles e instalar dependências.
