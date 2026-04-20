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

- scanner QR por câmera no app web (MVP): alternância entre entrada manual/câmera, leitura via `BarcodeDetector` + `getUserMedia` e fallback explícito para modo manual
- watch-only completo (fluxo local evoluiu para estado “preparado” com resumo de escopo/descriptor para `xpub/ypub/zpub`, ainda sem sincronização externa)
- PSBT end-to-end (assinatura/finalização/transmissão reais). A UX pós-detecção local agora exibe painel de revisão offline + checkpoint local de revisão concluída + preparação local de encaminhamento (simulação offline) para assinatura externa futura, sem export real/assinatura/broadcast nesta fase
- integração real com carteiras externas
- app Android
- edição Secure USB bootável de produção (hardening e validação em hardware real ainda em andamento)

### Secure USB Edition — fundação executável (abril/2026)

- pipeline inicial reproduzível com Debian Live (`live-build`) em `infra/usb`;
- build da ISO já integra bundle local do app web (`apps/web/dist`) e injeta no filesystem live;
- boot com `systemd` iniciando servidor local do app + Chromium em modo kiosk/fullscreen;
- política de sessão sensível em RAM (`/run/bursh-sensitive`) e persistência opcional apenas para não sensíveis (`/var/lib/bursh/watch-only` e `/var/lib/bursh/config`, via partição `BURSH-DATA`).

### Validação funcional desta fase

- checklist manual de validação web: `docs/web-functional-checklist.md`
- resultados esperados por caso: `docs/web-functional-expected-results.md`
- roteiro operacional da primeira rodada manual real: `docs/run-first-manual-web-validation.md`
- template de evidência de teste manual: `docs/web-test-report-template.md`
- fluxo para abertura de bugs funcionais web: `docs/web-bug-reporting-flow.md`
- status funcional e marco de transição para execução manual: `docs/project-status.md`
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
- `infra/usb`: fundação executável da Secure USB Edition (Debian Live + kiosk)

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
- `pnpm usb:prepare-web`
- `pnpm usb:build-iso`
- `pnpm usb:vm`

### Secure USB Edition — Secure USB Quick Start

Fluxo mínimo profissional (ISO -> VM -> pendrive físico -> registro de aceite):

1. gerar ISO;
2. validar boot automatizado em VM (PASS/FAIL + artefatos);
3. gravar pendrive físico (com opção de `BURSH-DATA`);
4. validar no hardware real e coletar evidência pós-boot.

Comandos:

```bash
pnpm usb:build-iso
./infra/usb/scripts/validate-vm-boot.sh
sudo ./infra/usb/scripts/prepare-physical-usb.sh /dev/sdX --with-bursh-data
```

No sistema live bootado no hardware real:

```bash
sudo /usr/local/bin/smoke-test-bursh-live.sh
sudo /usr/local/bin/collect-bursh-boot-evidence.sh
```

Critério objetivo de PASS em hardware:

- kiosk abre automaticamente em fullscreen;
- app responde em `http://127.0.0.1:4173`;
- serviços `bursh-storage-init`, `bursh-web` e `bursh-kiosk` ativos;
- `/run/bursh-sensitive` presente;
- `BURSH-DATA` montado apenas para `watch-only` e `config` (quando usado).

Guia completo e checklist operacional: `infra/usb/README.md`.

Após validar no hardware real, inicialize o registro padronizado da execução:

```bash
./infra/usb/scripts/init-hardware-validation-record.sh \
  --tester "nome" \
  --machine "maquina-a" \
  --iso "infra/usb/dist/bursh-secure-usb-amd64.iso" \
  --boot-mode "UEFI" \
  --scenario-id "HW-UEFI-02" \
  --with-bursh-data
```

Após cada rodada física, consolide o gate de aceite mínimo:

```bash
./infra/usb/scripts/summarize-hardware-validation.sh
```

Saída padrão do resumo: `infra/usb/dist/hardware-validation/summary.md` (com `GO`/`NO-GO` e gaps de cobertura).

Documentos de aceite profissional desta fase:

- checklist + matriz mínima: `docs/secure-usb-hardware-validation.md`;
- template de registro: `docs/templates/secure-usb-hardware-validation-record.md`;
- gate de release readiness (curto): `docs/secure-usb-release-readiness.md`.

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
- Scanner por câmera depende de navegador com `BarcodeDetector`, permissão do usuário e contexto seguro (`https`/`localhost`); QR fragmentado avançado segue fora do escopo.

## Roadmap resumido

1. Validar fluxos funcionais reais (scanner, PSBT end-to-end, integração com carteira externa).
2. Endurecer segurança aplicada (telemetria, hardening de execução, revisões contínuas).
3. Avançar entregáveis de plataforma (Android e Secure USB) após validação funcional web.
