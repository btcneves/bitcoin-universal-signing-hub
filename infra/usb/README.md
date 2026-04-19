# Secure USB Edition (fundação executável)

Esta pasta contém a primeira fundação reproduzível da edição bootável por pendrive.

## Arquitetura mínima escolhida (v1)

- Base: Debian Live (`live-build`, Bookworm, amd64).
- App: bundle estático de `apps/web` servido localmente em `127.0.0.1:4173`.
- Kiosk: Chromium em fullscreen (`--kiosk`) iniciado no boot via `systemd` + `xinit`.
- Sessão sensível: diretórios sensíveis em RAM (`/run/bursh-sensitive`).
- Persistência: somente dados não sensíveis em partição opcional com label `BURSH-DATA`, montada em `/mnt/bursh-data` e bind-mount para `/var/lib/bursh/watch-only` e `/var/lib/bursh/config`.

## Estrutura

- `scripts/prepare-web-bundle.sh`: builda `@bursh/web` e copia o bundle para o overlay da ISO.
- `scripts/build-iso.sh`: pipeline reproduzível local com `live-build`.
- `live-build/config/package-lists/`: pacotes base da edição bootável.
- `live-build/config/includes.chroot/`: arquivos injetados no filesystem final (scripts + unidades systemd).
- `live-build/config/hooks/live/`: hooks de build para criação de usuário e enable de serviços.

## Como gerar a ISO

Pré-requisitos em host Debian/Ubuntu:

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

## Política de dados aplicada nesta fundação

Nunca persistir:

- mnemonic/seed/passphrase;
- chave privada/xprv/WIF;
- payload sensível bruto.

Pode persistir (somente se não sensível):

- estado watch-only;
- preferências locais de UI/operação;
- checkpoints sem material secreto.
