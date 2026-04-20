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

### Secure USB Edition — fundação executável + hardening mínimo (abril/2026)

- pipeline inicial reproduzível com Debian Live (`live-build`) em `infra/usb`;
- build da ISO já integra bundle local do app web (`apps/web/dist`) e injeta no filesystem live;
- boot com `systemd` iniciando servidor local do app + Chromium em modo kiosk/fullscreen;
- política de sessão sensível em RAM (`/run/bursh-sensitive`) e persistência opcional apenas para não sensíveis (`/var/lib/bursh/watch-only` e `/var/lib/bursh/config`, via partição `BURSH-DATA`).
- defaults de runtime endurecidos: kiosk Chromium com networking de background desativado e serviço local web restrito por sandbox do `systemd` (sem exposição além de loopback).

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
- `pnpm usb:generate-signing-key`
- `pnpm usb:sign-iso`
- `pnpm usb:generate-sha256sums`
- `pnpm usb:verify-iso`
- `pnpm usb:vm`

### Secure USB Edition — Secure USB Quick Start

Fluxo mínimo profissional (ISO -> VM -> pendrive físico -> registro de aceite):

1. gerar ISO;
2. validar boot automatizado em VM (PASS/FAIL + artefatos);
3. gravar pendrive físico (com opção de `BURSH-DATA`);
4. validar no hardware real e coletar evidência pós-boot.

Comandos:

```bash
# primeira execução: gerar par de chaves dedicado para assinatura de ISO
pnpm usb:generate-signing-key

# build agora gera ISO + assinatura .sig + sha256sums.txt automaticamente
pnpm usb:build-iso

# (opcional) regenerar checksums manualmente para um par ISO/.sig já existente
pnpm usb:generate-sha256sums

# verificação offline obrigatória antes de VM/pendrive
pnpm usb:verify-iso

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

Distribuição/verificação de confiança da ISO:

- chave pública de release: `infra/usb/keys/bursh-secure-usb-signing-public.asc`;
- assinatura gerada no build: `infra/usb/dist/bursh-secure-usb-amd64.iso.sig`;
- checksums SHA-256 gerados no build: `infra/usb/dist/sha256sums.txt`;
- verificação offline: `./infra/usb/scripts/verify-iso.sh <iso> <iso.sig> [public-key.asc]`;
- **distribuição autenticada obrigatória:** publicar `iso`, `iso.sig`, `sha256sums.txt` e `bursh-secure-usb-signing-public.asc` como assets da mesma GitHub Release (tag única), com fingerprint da chave também no corpo da release e em canal secundário controlado (runbook interno ou portal seguro).

Fluxo de verificação recomendado para operador (antes de executar a ISO):

```bash
cd infra/usb/dist
sha256sum -c sha256sums.txt
```

Somente após `OK` para ISO e `.sig`, seguir para `pnpm usb:verify-iso` e depois VM/hardware.

Política curta de rotação da chave pública (release controlada):

1. rotação planejada a cada baseline de release final **ou imediatamente** em suspeita de comprometimento;
2. gerar novo par com `pnpm usb:generate-signing-key` em ambiente offline controlado;
3. publicar nova chave pública + fingerprint junto da release seguinte e manter chave anterior marcada como `deprecated` por janela de transição;
4. nunca publicar `infra/usb/keys/offline-signing/` (material privado).

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

Campanha mínima pós-assinatura/hardening (baseline controlada):

- cenários executados e registrados com `--scenario-id`: `HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`;
- consolidação via `./infra/usb/scripts/summarize-hardware-validation.sh` com gate final **GO** para a matriz mínima.

Status operacional mais recente (2026-04-20, UTC):

- `pnpm usb:check-host` reportou dependências ausentes: `lb`, `qemu-system-x86_64`, `qrencode`, `zbarimg` e `zbarcam`;
- execução no ambiente atual bloqueada na etapa `pnpm usb:build-iso` por ausência de `live-build` (`lb`);
- sem `iso/.sig/sha256sums.txt`, as verificações `sha256sum -c` e `pnpm usb:verify-iso` não puderam concluir;
- tentativa de rodada QR bloqueada em `pnpm usb:qr:generate` por ausência de `qrencode` no host;
- consolidado atual em `infra/usb/dist/hardware-validation/summary.md` indica `NO-GO` com cobertura pendente de `HW-UEFI-01`, `HW-UEFI-02` e `HW-ALT-01` (0 execuções encontradas).

Regra de release controlada nesta condição: **não criar tag/release** até repetir a rodada completa e obter `GO` no consolidado.

### Fluxo QR robusto (Secure USB Edition, offline-first)

Fluxo mínimo air-gapped de release: `seed -> xpub QR -> PSBT QR -> assinatura QR`, sem USB de dados e sem rede.

Exemplos:

```bash
# xpub para watch-only
pnpm usb:qr:generate -- --type xpub --payload "xpub..." --out /tmp/xpub.png
pnpm usb:qr:scan -- --image /tmp/xpub.png --expect xpub

# PSBT para assinatura offline
pnpm usb:qr:generate -- --type psbt --payload "cHNid..." --out /tmp/unsigned-psbt.png
pnpm usb:qr:scan -- --image /tmp/unsigned-psbt.png --expect psbt
```

Interpretação de erro de prefixo:

- se o payload vier como `ur:...` com tipo diferente do esperado, o fluxo deve falhar com erro explícito de **prefixo incompatível**;
- payload truncado (`ur:crypto-.../` sem conteúdo) deve falhar com erro de **payload ausente**;
- registrar no checklist físico se os handoffs de xpub e PSBT ficaram `PASS`.

Regras operacionais:

- nunca digitar seed/passphrase em dispositivo online;
- manter seed/passphrase apenas em RAM e limpar após falhas;
- executar em ambiente offline/amnésico durante toda a rodada de assinatura.

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
2. Consolidar cadeia mínima de confiança da ISO (assinatura + verificação offline) e validar sem regressão em VM/hardware.
3. Continuar hardening incremental de release (compatibilidade ampla em hardware).
4. Avançar entregáveis de plataforma (Android e Secure USB) após validação funcional web.

## Fluxo real offline-first com BIP39 + Watch-only + PSBT por QR (Secure USB Edition)

Novo fluxo operacional suportado nesta trilha:

1. **Verificação de seed BIP39 (offline, RAM-only):**
   - validar mnemonic;
   - derivar xpub e endereços para Bitcoin/Litecoin/Dogecoin;
   - opcionalmente comparar endereço conhecido e confirmar passphrase por equivalência de xpub.
2. **Criação de watch-only via QR:**
   - gerar QR do xpub no dispositivo offline;
   - importar no dispositivo watch-only sem seed/passphrase.
3. **PSBT air-gapped por QR:**
   - gerar PSBT no dispositivo watch-only;
   - importar PSBT por QR no dispositivo offline, revisar e assinar;
   - exportar PSBT assinada por QR de volta ao watch-only para broadcast.

### Regras de segurança obrigatórias

- seed/mnemonic/passphrase **nunca** devem ser persistidas em disco;
- processamento sensível ocorre em memória e deve ser descartado ao final da operação;
- não usar pendrive para transferir xpub/PSBT entre dispositivos do fluxo air-gapped;
- usar apenas QR por câmera/arquivo de imagem para handoff entre ambiente online/offline.

### Scripts de QR adicionados (Secure USB)

```bash
# gerar QR de xpub/PSBT
pnpm usb:qr:generate -- --payload "ur:crypto-hdkey/xpub..." --out /tmp/xpub.png

# ler QR de imagem
pnpm usb:qr:scan -- --image /tmp/xpub.png

# wrapper de handoff air-gapped
pnpm usb:qr:handoff -- export --payload "ur:crypto-psbt/..." --out /tmp/psbt.png
pnpm usb:qr:handoff -- import --image /tmp/psbt-signed.png
```

### Boas práticas operacionais

- preferir ambiente amnésico (ex.: Tails) para sessões sensíveis;
- verificar assinatura/checksum da ISO antes de boot (`pnpm usb:verify-iso` + `sha256sum -c`);
- manter dispositivo offline isolado de rede durante todo o fluxo de seed e assinatura;
- manter dispositivo watch-only sem acesso a chave privada.

## Fluxo offline real (seed -> watch-only -> PSBT assinada por QR)

Novo fluxo operacional offline-first, sem USB/rede para xpub/PSBT:

1. **Verificar seed BIP39 em RAM-only** (BTC/LTC/DOGE): derivar xpub/endereços e confirmar endereço conhecido.
2. **Checar passphrase sem expor texto**: derivação de xpub com e sem passphrase para confirmar consistência.
3. **Exportar xpub via QR UR**: `ur:crypto-hdkey/...` para dispositivo watch-only.
4. **Criar PSBT no watch-only** e exportar via `ur:crypto-psbt/...`.
5. **Assinar PSBT offline** no ambiente air-gapped com seed/passphrase somente em memória.
6. **Retornar PSBT assinada por QR** ao watch-only para transmissão.

Comandos auxiliares:

```bash
pnpm usb:qr:generate -- --type xpub --payload "xpub..." --out /tmp/xpub.png
pnpm usb:qr:scan -- --image /tmp/xpub.png --expect xpub
pnpm usb:qr:handoff export --type psbt --payload "cHNid..." --out /tmp/psbt.png
pnpm usb:qr:handoff import --image /tmp/psbt.png --expect psbt
```

Alertas de segurança operacional:

- executar em ambiente amnésico/offline (ex.: Tails com rede desativada);
- nunca gravar seed/passphrase em disco;
- verificar assinatura/checksum da ISO e do software antes de uso;
- manter handoff apenas por QR (sem pendrive ou rede para payload sensível).
