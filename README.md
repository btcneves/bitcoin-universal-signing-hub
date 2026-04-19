# Bitcoin Universal Recovery & Signing Hub (BURSH)

Plataforma **offline-first** para inspeção, recuperação e preparação de fluxos de assinatura Bitcoin de forma auditável e com separação clara de dados sensíveis.

## Objetivo e escopo

O BURSH busca oferecer uma base confiável para:

- interpretação segura de payloads (mnemonic, xpub/zpub, endereço, PSBT, BOLT11);
- fluxos de recuperação e assinatura com foco em segurança operacional;
- evolução incremental para integrações reais com carteiras externas.

**Fora do escopo desta fase:** Android completo, integração USB segura de produção e pagamentos Lightning completos.

## Princípios de segurança

- Segregação por zonas de confiança (dados sensíveis em memória de processo).
- Não persistência de material sensível (seed, mnemonic, chaves privadas).
- Redução de superfície por validações estruturais e tipagem explícita de payload.
- Transparência de riscos e limitações técnicas atuais.

Referências:

- Arquitetura: `docs/architecture.md`
- Modelo de ameaças: `docs/threat-model.md`
- Política de persistência: `docs/persistence-policy.md`

## Estado atual (abril/2026)

### Já funcional

- `install`
- `lint`
- `typecheck`
- `test`
- `build`
- `dev`
- app web abre localmente para fluxo de inspeção

### Experimental / parcial

- scanner QR em uso real (câmera/dispositivos heterogêneos)
- watch-only completo
- PSBT end-to-end (assinatura/finalização/transmissão reais)
- integração real com carteiras externas
- app Android
- pipeline Secure USB de produção

### Validação funcional desta fase

- checklist manual de validação web: `docs/web-functional-checklist.md`
- template de evidência de teste manual: `docs/web-test-report-template.md`
- fluxo para abertura de bugs funcionais web: `docs/web-bug-reporting-flow.md`
- status funcional consolidado: `docs/project-status.md`
- prioridades da próxima fase: `docs/roadmap.md`

### Riscos e exceções atuais

- advisory ignorado no audit: `GHSA-848j-6mx2-7j84` (exceção temporária documentada)
- aviso conhecido de engines quando ambiente local usa Node 24 (projeto declara `>=20.19 <23`)
- avisos eventuais de compatibilidade de browsers devem ser tratados como pendência de revisão contínua

## Stack atual

- Monorepo TypeScript
- pnpm workspaces
- Vite + React (web)
- Vitest
- ESLint + Prettier
- GitHub Actions (CI + Security)

## Estrutura do monorepo

- `apps/web`: interface web atual
- `apps/android`: espaço reservado/documental
- `packages/*`: motores e módulos de domínio (bitcoin, psbt, qr, lightning, segurança, tipos)
- `docs/`: documentação de arquitetura, políticas, status e roadmap

## Como rodar localmente

### Requisitos

- Node.js `>=20.19 <23`
- pnpm `>=10.13.1`
- npm `>=10.0.0` (fallback)

### Fluxo principal (pnpm)

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

### Fallback npm

```bash
npm install --workspaces
npm run lint
npm run typecheck
npm run test
npm run build
npm run dev
```

### Reprodutibilidade

Veja opções com Docker, Dev Container e bootstrap npm em `docs/reproducibility.md`.

## Comandos principais

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm dev`
- `pnpm audit --prod --ignore GHSA-848j-6mx2-7j84`

## Validação e governança técnica

- Status consolidado e decisões: `docs/project-status.md`
- Auditoria de módulos críticos: `docs/crypto-modules-audit.md`
- Modelo de ameaças: `docs/threat-model.md`
- Roadmap resumido: `docs/roadmap.md`
- Histórico arquivado: `docs/archive/`

## Limitações conhecidas

- Fluxos criptográficos críticos ainda dependem de validação funcional em ambiente real.
- O app atual é base sólida de inspeção/validação, não produto final de assinatura em produção.
- Ambiente com proxy restritivo pode bloquear instalação de dependências (`403` no registry).

## Roadmap resumido

1. Validar fluxos funcionais reais (scanner, PSBT end-to-end, integração com carteira externa).
2. Endurecer segurança aplicada (telemetria, hardening de execução, revisões contínuas).
3. Avançar entregáveis de plataforma (Android e Secure USB) após validação funcional web.
