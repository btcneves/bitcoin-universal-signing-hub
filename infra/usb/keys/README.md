# Secure USB ISO signing keys

Este diretório guarda os artefatos mínimos de confiança da ISO.

## Arquivos esperados

- `bursh-secure-usb-signing-public.asc`: chave pública distribuída junto da release.
- `release-signing-key-id.txt`: fingerprint usado para assinar.
- `offline-signing/` (não versionado): keyring local com chave privada para assinatura offline.

## Gerar par de chaves dedicado

```bash
./infra/usb/scripts/generate-iso-signing-key.sh
```

Após gerar:

1. distribuir `bursh-secure-usb-signing-public.asc` em canal autenticado da release;
2. manter `offline-signing/` somente em ambiente controlado de assinatura;
3. versionar apenas a chave pública (nunca a privada).
