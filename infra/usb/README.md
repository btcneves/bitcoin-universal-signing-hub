# Secure USB Edition (fluxo operacional)

Objetivo desta fase: fechar a lacuna entre validação em VM e uso real em pendrive/hardware com evidência mínima reproduzível.

## Estado atual consolidado

- ISO gerada de forma reproduzível (`live-build`);
- validação automatizada em VM já disponível com saída PASS/FAIL e artefatos;
- evidência de boot em ambiente virtual já existe;
- foco agora: execução real em pendrive + hardware físico.

## Fluxo único recomendado (ISO -> VM -> pendrive -> hardware)

### 1) Build da ISO

```bash
pnpm usb:build-iso
```

Saída esperada:

- `infra/usb/dist/bursh-secure-usb-amd64.iso`

### 2) Gate obrigatório em VM (não pular)

```bash
./infra/usb/scripts/validate-vm-boot.sh
```

PASS esperado:

- comando retorna exit code `0`;
- imprime `PASS`;
- gera artefatos em `infra/usb/dist/vm-validation/latest/`.

Se falhar aqui, não avance para pendrive/hardware.

### 3) Preparar pendrive físico

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

### 4) Boot no hardware real

1. ejetar o pendrive com segurança;
2. inserir na máquina alvo;
3. abrir menu de boot da BIOS/UEFI e selecionar o USB;
4. aguardar login/desktop com kiosk automático.

### 5) Validação pós-boot no hardware real

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
  --boot-mode "UEFI"
```

Preencha o arquivo gerado em `infra/usb/dist/hardware-validation/` com resultados do checklist e caminho do `.tar.gz` coletado no boot físico.

## Dependências mínimas no host

- `live-build` para gerar ISO;
- `qemu-system-x86_64` para validação VM;
- `parted` + `e2fsprogs` (`mkfs.ext4`) para preparação opcional de `BURSH-DATA`.

## Fora de escopo desta entrega

- signing real;
- backend;
- Android;
- novas features web;
- hardening avançado de release (fica para próximo passo após hardware).
