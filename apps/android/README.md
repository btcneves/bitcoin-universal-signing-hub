# Android shell (Capacitor)

This directory hosts the Capacitor wrapper for `apps/web`.

## Commands

```bash
pnpm --filter @bursh/web build
npx cap sync android
npx cap open android
```

Security note: Android build must preserve offline-first defaults and never persist seed/passphrase.
