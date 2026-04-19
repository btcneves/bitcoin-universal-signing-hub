# Reprodutibilidade de ambiente

## Versões suportadas

- Node.js: `>=20.19 <23`
- pnpm: `>=10.13.1`
- npm: `>=10.0.0`

As versões são reforçadas em `package.json` (`engines` e `packageManager`).

## Caminhos suportados

### Opção A — Local com pnpm (preferencial)

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Opção B — Docker

```bash
docker build -t bursh-dev .
docker run --rm -it bursh-dev pnpm test
```

### Opção C — Dev Container

- Abrir o repositório com Dev Containers no VS Code.
- Executar o fluxo de validação padrão no container.

### Opção D — Bootstrap npm (fallback)

```bash
./scripts/bootstrap-npm.sh
```

## Notas operacionais

- Em CI, a validação mínima esperada é: install + lint + typecheck + test + build.
- Caso `install` falhe com `403 Forbidden`, o problema é de rede/proxy do ambiente, não necessariamente do código.
- Node 24 pode gerar warning de engines; a faixa oficialmente suportada continua sendo Node 20/22 dentro de `>=20.19 <23`.
