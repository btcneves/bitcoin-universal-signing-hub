# Architecture

## Security zones

- **Zone 0 (RAM only):** BIP39 mnemonic, passphrase, seed, private key derivation.
- **Zone 1 (private non-critical):** xpub/ypub/zpub, wallet preferences.
- **Zone 2 (network):** block explorer or node broadcast adapters.

No direct dependency from Zone 2 into Zone 0 is allowed.

## Monorepo layout

- `apps/web`: React + Vite + PWA UX.
- `apps/android`: Capacitor shell.
- `packages/*`: domain and engine modules.
- `infra/usb`: live USB scripts.
