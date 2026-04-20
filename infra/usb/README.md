# Secure USB Edition (fundação executável)

Esta pasta contém a fundação reproduzível da edição bootável por pendrive e agora inclui trilha prática de validação até boot real (VM/pendrive).

## Diagnóstico objetivo atual

### Já implementado e executável

- build de ISO live com Debian Live (`live-build`, Bookworm, amd64);
- inclusão automática do bundle web (`apps/web/dist`) na imagem;
- boot com `systemd` iniciando política de storage, servidor local e Chromium em kiosk fullscreen;
- separação de dados:
  - sessão sensível em RAM (`/run/bursh-sensitive`);
  - persistência opcional apenas para não sensíveis (`watch-only` e `config`) em partição label `BURSH-DATA`;
- smoke test interno no ambiente live (`/usr/local/bin/smoke-test-bursh-live.sh`) para validar serviços/autostart/app/storage policy.

### Ainda parcial / estrutura inicial

- hardening de produção (secure boot chain, assinatura de imagem, lockdown adicional de runtime);
- matriz ampla de compatibilidade de hardware real;
- automação de testes de boot em CI com evidência contínua.

### Lacuna já fechada nesta entrega

- havia fundação executável de build/boot, mas faltava trilha operacional curta para validar runtime em VM e pendrive com passos repetíveis;
- agora existem script de execução em QEMU + checklist/smoke test para validação real de boot e política de persistência.

## Estrutura

- `scripts/prepare-web-bundle.sh`: builda `@bursh/web` e copia o bundle para o overlay da ISO.
- `scripts/build-iso.sh`: pipeline reproduzível local com `live-build`.
- `scripts/run-vm-qemu.sh`: sobe a ISO em QEMU para teste de boot.
- `live-build/config/package-lists/`: pacotes base da edição bootável.
- `live-build/config/includes.chroot/`: arquivos injetados no filesystem final (scripts + unidades systemd).
- `live-build/config/hooks/live/`: hooks de build para criação de usuário e enable de serviços.

## Como gerar a ISO

Pré-requisitos no host Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y live-build
pnpm install
```

Build:

```bash
./infra/usb/scripts/build-iso.sh
```

Saída esperada:

- `infra/usb/dist/bursh-secure-usb-amd64.iso`

## Como testar em VM (QEMU)

Pré-requisitos no host Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y qemu-system-x86 qemu-utils ovmf
```

### Modo efêmero (sem persistência)

```bash
./infra/usb/scripts/run-vm-qemu.sh
```

### Modo com persistência não sensível

```bash
truncate -s 2G infra/usb/dist/bursh-data.img
mkfs.ext4 -L BURSH-DATA infra/usb/dist/bursh-data.img
./infra/usb/scripts/run-vm-qemu.sh infra/usb/dist/bursh-secure-usb-amd64.iso infra/usb/dist/bursh-data.img
```

No boot da VM:

1. aguarde o kiosk abrir;
2. vá para TTY2 (`Ctrl+Alt+F2`);
3. execute:

```bash
sudo /usr/local/bin/smoke-test-bursh-live.sh
```

## Como testar em pendrive físico

> **Atenção**: o comando abaixo apaga completamente o dispositivo alvo.

1. identifique o device corretamente (`lsblk`), exemplo `/dev/sdX`;
2. grave a ISO:

```bash
sudo dd if=infra/usb/dist/bursh-secure-usb-amd64.iso of=/dev/sdX bs=4M status=progress conv=fsync,notrunc
```

3. remova e reconecte o pendrive, faça boot por ele;
4. no sistema live bootado, rode o smoke test:

```bash
sudo /usr/local/bin/smoke-test-bursh-live.sh
```

## Checklist mínimo de validação no boot

- kiosk abre automaticamente em fullscreen;
- app responde em `127.0.0.1:4173`;
- `bursh-storage-init.service`, `bursh-web.service` e `bursh-kiosk.service` ativos;
- `/run/bursh-sensitive` presente (RAM);
- sem `BURSH-DATA`: modo efêmero;
- com `BURSH-DATA`: somente `watch-only` e `config` persistem via bind mount.

## Política de dados aplicada

Nunca persistir:

- mnemonic/seed/passphrase;
- chave privada/xprv/WIF;
- payload sensível bruto.

Pode persistir (somente se não sensível):

- estado watch-only;
- preferências locais de UI/operação;
- checkpoints sem material secreto.
