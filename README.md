# Bitcoin Universal Recovery & Signing Hub (BURSH)

Offline-first, security-critical platform for Bitcoin wallet recovery, watch-only operation, PSBT flows, and external signing.

## Core goals

- Recover wallets via BIP39 mnemonic + optional passphrase.
- Support xpub/ypub/zpub watch-only wallets.
- Create/import/validate/finalize PSBT (BIP174).
- Parse BOLT11 invoices.
- Use QR as primary transport.
- Keep sensitive material in RAM only.

## Stack

- Monorepo: `pnpm` + `turborepo`
- Web app: React + TypeScript + Vite + PWA
- Android: Capacitor wrapper
- Secure USB edition: Linux live kiosk skeleton

## Security model

### Zone 0 - Sensitive (RAM only)
- Mnemonic
- Passphrase
- Seed/private keys

### Zone 1 - Private non-critical
- xpub/ypub/zpub
- non-sensitive settings

### Zone 2 - Network
- Broadcast adapters
- future remote indexers

> Rule: Zone 2 must never touch Zone 0 objects directly.

## Repository layout

```text
apps/
  web/
  android/
packages/
  core-domain/
  security-core/
  bitcoin-engine/
  psbt-engine/
  qr-engine/
  lightning-engine/
  network-adapters/
  shared-types/
  ui/
infra/
  usb/
docs/
.github/
```

## Quick start

```bash
pnpm install
pnpm dev
pnpm test
```

## Main interfaces

- `MnemonicService`
- `WalletService`
- `PsbtService`
- `QRService`
- `LightningService`
- `BroadcastService`
- `ExternalSignerAdapter`

## Persistence policy

Allowed to persist:
- xpub/ypub/zpub
- UI preferences
- application settings

Forbidden to persist:
- mnemonic
- passphrase
- seed
- private keys

## USB Secure Edition

`infra/usb/` provides baseline scripts and service templates for:
- live mode boot
- kiosk fullscreen startup
- optional encrypted persistent partition for non-sensitive data

## Development roadmap

See `docs/roadmap.md` and `docs/architecture.md`.
