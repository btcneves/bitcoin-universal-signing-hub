# Secure USB Edition (fluxo operacional)

Objetivo desta fase: fechar a lacuna entre validação em VM e uso real em pendrive/hardware com evidência mínima reproduzível.

## Estado atual consolidado

- ISO gerada de forma reproduzível (`live-build`);
- validação automatizada em VM já disponível com saída PASS/FAIL e artefatos;
- evidência de boot em ambiente virtual já existe;
- fluxo pendrive físico + hardware real operacional;
- **hardening mínimo inicial aplicado** (defaults mais restritivos no runtime live/kiosk).
- **cadeia mínima de confiança de release iniciada** (assinatura GPG da ISO + verificação offline).

## Hardening mínimo aplicado nesta fase

Escopo deliberadamente pequeno e de alto impacto, sem abrir cadeia de produto nova:

1. **Persistência opcional com bind mounts endurecidos**
   - partição `BURSH-DATA` continua opcional;
   - bind mounts de `watch-only` e `config` agora são remontados com `nosuid,nodev,noexec`;
   - criação de diretórios com `umask 077` para reduzir exposição por permissão ampla.

2. **Kiosk Chromium mais restritivo por default**
   - desativa componentes de networking/background e update em runtime (`--disable-background-networking`, `--disable-component-update`, etc.);
   - mantém uso dedicado offline-first em `127.0.0.1:4173`.

3. **Servidor web local com sandbox `systemd`**
   - roda como usuário não privilegiado (`bursh`);
   - `ProtectSystem=strict`, `NoNewPrivileges=yes`, isolamento adicional de namespaces/suid;
   - rede restrita a loopback (`IPAddressDeny=any` + allow explícito para `127.0.0.1` e `::1`).

## Fluxo único recomendado (ISO -> VM -> pendrive -> hardware)

## Guia único para Windows + Visual Studio (WSL/VM Linux obrigatório)

Para ambiente Windows, o fluxo recomendado é executar **todo o pipeline dentro de Linux** (via **WSL2 Ubuntu** ou **VM Linux** aberta no Visual Studio/terminal integrado).  
Os scripts da trilha Secure USB foram escritos em shell (`.sh`) e dependem de utilitários Linux.

### 0) Preparar ambiente Linux no Windows

Opção A (recomendada): **WSL2 + Ubuntu**

```powershell
wsl --install -d Ubuntu
```

Depois, abra o terminal Ubuntu (ou profile WSL no Visual Studio) e instale dependências do host:

```bash
sudo apt update
sudo apt install -y live-build qemu-system-x86 gnupg coreutils parted e2fsprogs
```

Opção B: **VM Linux** (Hyper-V/VirtualBox/VMware) com os mesmos pacotes:

```bash
sudo apt update
sudo apt install -y live-build qemu-system-x86 gnupg coreutils parted e2fsprogs
```

### 1) Preparar monorepo e rodar qualidade completa

> Use Node **`>=20.19 <23`**.

```bash
corepack enable pnpm
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### 2) Gerar ISO assinada + `sha256sums.txt`

Primeira execução (gera par de chaves de assinatura da ISO):

```bash
pnpm usb:generate-signing-key
```

Build da ISO (gera ISO + `.sig` + `sha256sums.txt`):

```bash
pnpm usb:build-iso
```

### 3) Validar checksums e assinatura (gate obrigatório)

```bash
cd infra/usb/dist
sha256sum -c sha256sums.txt
cd ../../..
pnpm usb:verify-iso
```

### 4) Validar boot em VM com QEMU

```bash
./infra/usb/scripts/validate-vm-boot.sh
```

### 5) Preparar pendrive físico

```bash
sudo ./infra/usb/scripts/prepare-physical-usb.sh /dev/sdX
```

Com partição opcional `BURSH-DATA`:

```bash
sudo ./infra/usb/scripts/prepare-physical-usb.sh /dev/sdX --with-bursh-data
```

### 6) Validar no hardware live (já bootado pela ISO)

```bash
sudo /usr/local/bin/smoke-test-bursh-live.sh
sudo /usr/local/bin/collect-bursh-boot-evidence.sh
```

### 7) Registrar matriz mínima e consolidar gate final

```bash
./infra/usb/scripts/init-hardware-validation-record.sh \
  --tester "nome" \
  --machine "maquina-a" \
  --iso "infra/usb/dist/bursh-secure-usb-amd64.iso" \
  --boot-mode "UEFI" \
  --scenario-id "HW-UEFI-01"
```

Repita para os cenários mínimos (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`) e consolide:

```bash
./infra/usb/scripts/summarize-hardware-validation.sh
```

**Regra de release:** sem checklist completo da matriz mínima e sem `GO` no `infra/usb/dist/hardware-validation/summary.md`, **não criar tag/release**.

### Limitações no Windows (Developer PowerShell)

- `Developer PowerShell` não é ambiente Linux e pode falhar para scripts `.sh`, permissões, paths `/dev/sdX`, `sha256sum`, `sudo` e utilitários GNU;
- prefira **WSL** (primeira escolha) ou **Git Bash** para execução de shell script;
- para fluxo ISO/VM/pendrive/hardware, prefira WSL/VM Linux (Git Bash ajuda em comandos simples, mas não substitui dependências de sistema Linux como `live-build`, QEMU completo e fluxo de bloco/disco).

### 1) Gerar chave de assinatura (primeira execução)

```bash
pnpm usb:generate-signing-key
```

Arquivos gerados:

- `infra/usb/keys/bursh-secure-usb-signing-public.asc`
- `infra/usb/keys/release-signing-key-id.txt`
- `infra/usb/keys/offline-signing/` (privado, não versionado)

### 2) Build da ISO (assinatura automática)

```bash
pnpm usb:build-iso
```

Saída esperada:

- `infra/usb/dist/bursh-secure-usb-amd64.iso`
- `infra/usb/dist/bursh-secure-usb-amd64.iso.sig`
- `infra/usb/dist/sha256sums.txt`

Regeneração independente de checksums (quando necessário):

```bash
pnpm usb:generate-sha256sums
```

Também é possível apontar artefatos explícitos:

```bash
./infra/usb/scripts/generate-sha256sums.sh \
  infra/usb/dist/bursh-secure-usb-amd64.iso \
  infra/usb/dist/bursh-secure-usb-amd64.iso.sig
```

### 3) Verificação offline obrigatória da assinatura

```bash
pnpm usb:verify-iso
```

Também é possível apontar arquivos explícitos:

```bash
./infra/usb/scripts/verify-iso.sh \
  infra/usb/dist/bursh-secure-usb-amd64.iso \
  infra/usb/dist/bursh-secure-usb-amd64.iso.sig \
  infra/usb/keys/bursh-secure-usb-signing-public.asc
```

Se falhar, **não** avance para VM/hardware.

Verificação obrigatória de checksums (antes de rodar a ISO):

```bash
cd infra/usb/dist
sha256sum -c sha256sums.txt
```

Se qualquer arquivo retornar diferente de `OK`, interrompa o fluxo e descarte os artefatos.

### 4) Gate obrigatório em VM (não pular)

```bash
./infra/usb/scripts/validate-vm-boot.sh
```

PASS esperado:

- comando retorna exit code `0`;
- imprime `PASS`;
- gera artefatos em `infra/usb/dist/vm-validation/latest/`.

Se falhar aqui, não avance para pendrive/hardware.

### 5) Preparar pendrive físico

> **Atenção:** gravação de ISO apaga o disco alvo.

Identifique o dispositivo alvo (exemplo `/dev/sdX`):

```bash
lsblk -o NAME,SIZE,MODEL,TRAN
```

Gravar ISO apenas:

```bash
sudo ./infra/usb/scripts/prepare-physical-usb.sh /dev/sdX
```

Gravar ISO + criar partição opcional `BURSH-DATA` (ext4):

```bash
sudo ./infra/usb/scripts/prepare-physical-usb.sh /dev/sdX --with-bursh-data
```

### 6) Boot no hardware real

1. ejetar o pendrive com segurança;
2. inserir na máquina alvo;
3. abrir menu de boot da BIOS/UEFI e selecionar o USB;
4. aguardar login/desktop com kiosk automático.

### 7) Validação pós-boot no hardware real

No sistema live bootado, executar:

```bash
sudo /usr/local/bin/smoke-test-bursh-live.sh
sudo /usr/local/bin/collect-bursh-boot-evidence.sh
```

## Checklist objetivo de hardware real

### PASS

Considere **PASS** somente quando todos os itens abaixo forem verdadeiros:

- kiosk abre automaticamente em fullscreen;
- app local responde em `http://127.0.0.1:4173`;
- `bursh-storage-init.service` ativo;
- `bursh-web.service` ativo;
- `bursh-kiosk.service` ativo;
- `/run/bursh-sensitive` existe;
- sem `BURSH-DATA`: modo efêmero OK;
- com `BURSH-DATA`: mount em `/mnt/bursh-data` e bind mounts de `/var/lib/bursh/watch-only` e `/var/lib/bursh/config` ativos.

### FAIL

Considere **FAIL** se ocorrer qualquer um dos pontos:

- kiosk não inicia automaticamente;
- app local indisponível em `127.0.0.1:4173`;
- qualquer serviço BURSH essencial inativo;
- diretório sensível em RAM ausente (`/run/bursh-sensitive`);
- comportamento de persistência fora da política (ex.: `BURSH-DATA` presente sem bind mounts esperados).

## Coleta de evidência mínima (pós-boot)

Script: `/usr/local/bin/collect-bursh-boot-evidence.sh`

Sem argumentos (default):

- salva em `/mnt/bursh-data` quando montado e gravável;
- fallback para `/tmp` quando `BURSH-DATA` não está disponível.

Com diretório explícito:

```bash
sudo /usr/local/bin/collect-bursh-boot-evidence.sh /tmp
```

Artefatos gerados:

- `services-summary.txt` (status dos serviços BURSH);
- `systemctl-status-*.txt` (status detalhado por serviço);
- `journal-*.txt` e `journal-boot*.txt` (logs relevantes de boot e serviços);
- `mount.txt`, `findmnt*.txt`, `lsblk-f.txt` (estado de mounts/discos, incluindo `BURSH-DATA`);
- `smoke-test.txt` (saída do smoke test);
- arquivo compactado `.tar.gz` pronto para anexar em evidência.

## Aceite profissional mínimo (hardware real)

- checklist formal + critérios `PASS/FAIL/BLOCKED`: `docs/secure-usb-hardware-validation.md`;
- matriz mínima obrigatória de execução: `docs/secure-usb-hardware-validation.md`;
- template padronizado de evidência: `docs/templates/secure-usb-hardware-validation-record.md`;
- gate de readiness: `docs/secure-usb-release-readiness.md`.

Inicializar registro-base da execução (host):

```bash
./infra/usb/scripts/init-hardware-validation-record.sh \
  --tester "nome" \
  --machine "maquina-a" \
  --iso "infra/usb/dist/bursh-secure-usb-amd64.iso" \
  --boot-mode "UEFI" \
  --scenario-id "HW-UEFI-01"
```

Preencha o arquivo gerado em `infra/usb/dist/hardware-validation/` com resultados do checklist e caminho do `.tar.gz` coletado no boot físico.

Consolidar todas as rodadas físicas registradas:

```bash
./infra/usb/scripts/summarize-hardware-validation.sh
```

O comando gera `infra/usb/dist/hardware-validation/summary.md` com:

- total de execuções;
- contagens agregadas `PASS/FAIL/BLOCKED`;
- cobertura da matriz obrigatória (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`);
- gate final `GO`/`NO-GO` + gaps.

## Distribuição autenticada da chave pública (release controlada)

Pacote único de confiança por versão da ISO assinada:

- publicar **no mesmo GitHub Release** (mesma tag/versionamento) os arquivos:
  - `bursh-secure-usb-amd64.iso`
  - `bursh-secure-usb-amd64.iso.sig`
  - `sha256sums.txt`
  - `bursh-secure-usb-signing-public.asc`
- repetir no corpo da release o fingerprint exato da chave pública (`release-signing-key-id.txt`), com data de vigência;
- espelhar o fingerprint em um **canal secundário autenticado** (runbook interno assinado, portal seguro corporativo ou comunicado assinado da equipe de release);
- nunca distribuir `infra/usb/keys/offline-signing/` (material privado).

Política de rotação:

1. rotação programada ao fechar baseline final de release (ou imediata em incidente/suspeita);
2. novo par gerado somente em ambiente offline controlado (`pnpm usb:generate-signing-key`);
3. chave anterior pode permanecer por janela curta de transição apenas para validação de versões legadas;
4. toda rotação exige atualização explícita de documentação de readiness e fingerprint publicado.

Fluxo de confiança mínimo para operador:

1. obter `iso`, `iso.sig`, `sha256sums.txt` e `bursh-secure-usb-signing-public.asc` a partir da release autenticada;
2. validar checksums (`sha256sum -c sha256sums.txt`);
3. validar assinatura (`verify-iso.sh`);
4. somente com `PASS` seguir para VM e gravação em pendrive.

## Consolidação prática pós-assinatura (matriz mínima)

Execução consolidada desta entrega:

- `validate-vm-boot.sh` faz parte do gate obrigatório pré-hardware (na campanha controlada, manter artefatos em `infra/usb/dist/vm-validation/latest`);
- registros físicos inicializados com `init-hardware-validation-record.sh --scenario-id` para `HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`;
- consolidação final por `summarize-hardware-validation.sh` com resultado esperado `GO` para liberar baseline de release controlada.

## Dependências mínimas no host

- `live-build` para gerar ISO;
- `qemu-system-x86_64` para validação VM;
- `parted` + `e2fsprogs` (`mkfs.ext4`) para preparação opcional de `BURSH-DATA`.

## Fora de escopo desta entrega

- signing real;
- backend;
- Android;
- novas features web;
- novas features de produto fora da trilha de confiança da ISO.

## Checklist curto pós-hardening

Rodar após boot (VM e hardware), antes de anexar evidência final:

- `sha256sum -c infra/usb/dist/sha256sums.txt` (PASS dos checksums da ISO e `.sig` recebidos da release);
- `./infra/usb/scripts/verify-iso.sh` (PASS da assinatura antes de gravar pendrive);
- `systemctl status bursh-storage-init.service --no-pager` (ativo);
- `systemctl status bursh-web.service --no-pager` (ativo, usuário `bursh`);
- `systemctl status bursh-kiosk.service --no-pager` (ativo);
- `curl -I http://127.0.0.1:4173` (resposta HTTP local);
- `findmnt -no OPTIONS /var/lib/bursh/watch-only` e `/var/lib/bursh/config` (quando `BURSH-DATA` existir, confirmar `nosuid,nodev,noexec`);
- `sudo /usr/local/bin/smoke-test-bursh-live.sh` (PASS).

## Fluxo QR air-gapped (xpub + PSBT) sem USB de dados

Para manter o princípio offline-first, a troca entre dispositivo offline e watch-only deve ocorrer por QR.

### 1) Gerar QR do xpub no ambiente offline

```bash
./infra/usb/scripts/generate-qr-payload.sh \
  --payload "ur:crypto-hdkey/<xpub-ou-zpub>" \
  --out /tmp/watch-only-xpub.png
```

### 2) Importar xpub no dispositivo watch-only

- escanear `watch-only-xpub.png` com a wallet watch-only;
- criar carteira somente observação (sem seed, sem passphrase);
- gerar PSBT no watch-only para o pagamento.

### 3) Exportar PSBT por QR e assinar offline

No watch-only, exibir a PSBT como QR (`ur:crypto-psbt/...`) e no offline:

```bash
./infra/usb/scripts/scan-qr-payload.sh --camera
# ou
./infra/usb/scripts/scan-qr-payload.sh --image /tmp/psbt.png
```

Após assinatura offline, gerar QR da PSBT assinada:

```bash
./infra/usb/scripts/generate-qr-payload.sh \
  --payload "ur:crypto-psbt/<psbt-assinada-base64>" \
  --out /tmp/psbt-signed.png
```

### 4) Broadcast no dispositivo watch-only

- importar o QR assinado no watch-only;
- finalizar/transmitir para a rede no dispositivo online.

### Regras de segurança desse fluxo

- não salvar seed/passphrase em arquivos, histórico shell ou partição persistente;
- não copiar PSBT/xpub por pendrive entre ambientes;
- chaves privadas permanecem somente no dispositivo offline.

## Fluxo air-gapped por QR (xpub + PSBT)

A trilha Secure USB agora inclui handoff explícito por QR para watch-only:

- **xpub para watch-only:** `ur:crypto-hdkey/...`
- **PSBT para assinatura offline:** `ur:crypto-psbt/...`
- **Seed/passphrase por QR opcional (entrada local):** `ur:crypto-seed/...` e `ur:crypto-passphrase/...`

Exemplos:

```bash
pnpm usb:qr:generate -- --type xpub --payload "xpub..." --out /tmp/watch-only-xpub.png
pnpm usb:qr:scan -- --image /tmp/watch-only-xpub.png --expect xpub

pnpm usb:qr:generate -- --type psbt --payload "cHNid..." --out /tmp/unsigned-psbt.png
pnpm usb:qr:scan -- --camera --expect psbt
```

Dependências recomendadas no host/VM para o fluxo QR:

- `qrencode` (geração);
- `zbarimg` (leitura por imagem);
- `zbarcam` (leitura por câmera).

## Fluxo QR robusto (baseline de release)

Para fechar baseline confiável, cada cenário (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`) deve executar:

1. `pnpm usb:qr:generate` para `xpub`, `psbt`, `seed` e `passphrase`;
2. `pnpm usb:qr:scan --expect ...` validando prefixo correto e rejeitando prefixo UR errado;
3. `init-hardware-validation-record.sh --scenario-id ...` registrando handoff QR;
4. `summarize-hardware-validation.sh` confirmando gate final `GO`.

Exemplo rápido:

```bash
pnpm usb:qr:generate -- --type xpub --payload "xpub..." --out /tmp/xpub.png
pnpm usb:qr:scan -- --image /tmp/xpub.png --expect xpub

pnpm usb:qr:generate -- --type psbt --payload "cHNid..." --out /tmp/psbt.png
pnpm usb:qr:scan -- --image /tmp/psbt.png --expect psbt
```

Erros esperados e interpretação:

- `prefixo incompatível`: QR `ur:...` do tipo errado (ex.: `crypto-seed` quando esperava `crypto-psbt`);
- `payload ausente`: UR truncada (`ur:crypto-.../` sem conteúdo);
- dependências ausentes (`qrencode`, `zbarimg`, `zbarcam`): instalar via `sudo apt-get install -y qrencode zbar-tools`.

Alertas operacionais obrigatórios:

- seed/passphrase não devem ser digitadas em dispositivos online;
- manter operação em ambiente offline/amnésico;
- não usar USB/rede para transportar seed, passphrase, xpub ou PSBT entre zonas.

## Status operacional mais recente (2026-04-20, UTC)

Rodada executada no ambiente atual:

- `pnpm usb:check-host` detectou ausências de `lb`, `qemu-system-x86_64`, `qrencode`, `zbarimg` e `zbarcam`;
- `pnpm usb:build-iso` falhou por falta de `live-build` (`lb`);
- `pnpm usb:qr:generate` (`--type xpub`) falhou por falta de `qrencode`;
- `./infra/usb/scripts/summarize-hardware-validation.sh` gerou `NO-GO` com 0 execuções e gaps em `HW-UEFI-01`, `HW-UEFI-02` e `HW-ALT-01`.

Próximo passo obrigatório: repetir a campanha em host funcional com todas as dependências instaladas antes de considerar tag/release.
