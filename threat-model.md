# Threat Model

## Assets
- Mnemonic and passphrase
- Derived seed and private keys
- PSBT transaction intent
- xpub portfolio metadata

## Adversaries
- Malware in online environment
- Supply chain tampering
- Malicious QR payload injection
- Local forensic extraction on persistent media

## Key mitigations
- Zone 0 RAM-only sensitive handling
- Strict parser and payload type detection
- No sensitive telemetry/logging
- Offline-first execution path
- Planned reproducible builds for USB image
