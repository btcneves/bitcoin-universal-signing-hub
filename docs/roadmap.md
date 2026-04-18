# Roadmap

Referência obrigatória: **estrutura inicial não validada**.

## Fase A — Base técnica auditável

- ampliar vetores de teste para BIP39/BIP32/BIP84;
- reforçar parser básico PSBT com cobertura de campos obrigatórios;
- ampliar parser básico BOLT11 com validação de assinatura;
- mapear comportamentos de erro com casos adversariais.

## Fase B — Segurança aplicada

- cobertura de redaction em todo fluxo de logs;
- revisão de stores/hooks para evitar retenção de seed/passphrase;
- política de build para bloquear `console.log` em módulos sensíveis.

## Fase C — Validação de execução

- pipeline repetível de `install/build/lint/test`;
- execução em ambiente offline controlado;
- matriz de compatibilidade QR (BlueWallet, Sparrow, Nunchuk).
