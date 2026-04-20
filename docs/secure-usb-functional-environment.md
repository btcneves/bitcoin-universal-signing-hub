# Secure USB Edition — Functional Environment Setup (GO Gate)

Este guia é uma nota rápida para preparar um host funcional capaz de executar a trilha mínima completa da Secure USB Edition sem contorno de dependências.

## Requisitos mínimos de host

- Ubuntu/Debian com privilégios de administrador.
- Ferramentas obrigatórias:
  - `live-build` (`lb`) para gerar a ISO.
  - `qemu-system-x86_64` para validação em VM.
  - `gnupg` para assinatura/verificação.
  - `coreutils` para `sha256sum`.
  - `qrencode` para geração de QR de handoff (`xpub`/`psbt`).
  - `zbarimg` e `zbarcam` para leitura/validação de QR.

Instalação rápida:

```bash
sudo apt-get update
sudo apt-get install -y live-build qemu-system-x86 gnupg coreutils qrencode zbar-tools
```

## Pré-checagem automatizada

```bash
pnpm usb:check-host
```

O comando gera `infra/usb/dist/host-requirements-report.txt` com status `OK/MISS` por dependência.

## Execução mínima para gate GO

1. Build completo da ISO com assinatura e checksums:

```bash
pnpm usb:build-iso
```

Artefatos esperados em `infra/usb/dist/`:

- `bursh-secure-usb-amd64.iso`
- `bursh-secure-usb-amd64.iso.sig`
- `sha256sums.txt`

2. Regerar checksums (opcional, valida pipeline isolado):

```bash
pnpm usb:generate-sha256sums
sha256sum -c infra/usb/dist/sha256sums.txt
```

3. Verificar assinatura:

```bash
pnpm usb:verify-iso
```

4. Validar matriz mínima em VM:

```bash
./infra/usb/scripts/validate-vm-boot.sh
```

5. Validar hardware físico (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`) com:

- `init-hardware-validation-record.sh --scenario-id`
- `smoke-test-bursh-live.sh`
- `collect-bursh-boot-evidence.sh`

6. Consolidar:

```bash
pnpm usb:summary
```

Somente seguir para release taggeada quando o consolidado estiver em **GO**.

7. Validar handoffs QR no host/VM antes da rodada física:

```bash
pnpm usb:qr:generate -- --type xpub --payload "xpub..." --out /tmp/xpub.png
pnpm usb:qr:scan -- --image /tmp/xpub.png --expect xpub

pnpm usb:qr:generate -- --type psbt --payload "cHNid..." --out /tmp/psbt.png
pnpm usb:qr:scan -- --image /tmp/psbt.png --expect psbt
```

Sem `qrencode`/`zbarimg`/`zbarcam`, registrar `BLOCKED` para handoff QR e não avançar para gate final.

## Troubleshooting (ambiente bloqueado)

Se `apt-get update` retornar `403 Forbidden` (proxy/política de rede), o host não está funcional para esta etapa. Nesse caso:

1. Não abrir escopo de código para contornar dependências.
2. Migrar execução para runner/host com acesso liberado aos repositórios Ubuntu/Debian.
3. Reexecutar a trilha acima do início (`pnpm usb:check-host` → `pnpm usb:build-iso` ...).
