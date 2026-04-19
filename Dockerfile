FROM node:22-bookworm-slim

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json vitest.workspace.ts .eslintrc.cjs eslint.config.cjs .prettierrc ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts

ENV HUSKY=0

RUN pnpm install --frozen-lockfile=false

CMD ["pnpm", "test"]
