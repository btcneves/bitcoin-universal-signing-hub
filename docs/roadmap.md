# Roadmap

Roadmap prático para evoluir a Secure USB Edition sem expandir escopo.

## Fase atual — Secure USB com utilidade real (offline + air-gapped QR)

Referências operacionais: `README.md` e `infra/usb/README.md`.

### P0 — Obrigatório agora (fechado nesta entrega)

- manter fluxo ISO -> VM -> pendrive -> hardware sem regressão;
- hardening mínimo de runtime ativo (loopback-only, sandbox de serviço local, defaults kiosk restritivos);
- assinatura de ISO no build e verificação offline operacional;
- geração automática/publicação de `sha256sums.txt` com verificação obrigatória antes da execução da ISO;
- distribuição autenticada da chave pública junto da release assinada;
- matriz mínima (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`) consolidada com gate `GO`.

### P1 — Próximo passo (baseline final de release + robustez funcional)

- repetir campanha da matriz mínima para baseline final da versão candidata;
- confirmar `GO` da matriz mínima após cada nova rodada com checksums + assinatura;
- ampliar cobertura em hardware heterogêneo mantendo o mesmo checklist/gate;
- validar operação da política de rotação da chave pública sem quebrar verificações offline.
- expandir matriz de testes para variações de seed BIP39, xpub watch-only e roundtrip PSBT assinada por QR.

### P2 — Release readiness ampliado (hardening + validação cruzada)

- trilha de evidência contínua para auditoria de boot/runtime;
- baseline de operação repetível para versão candidata a release;
- revisão final de documentação operacional para handoff externo.
- validação em ambiente amnésico (Tails-like) com checklist de verificação de ISO/assinatura.

## Itens explicitamente fora da etapa atual

- backend;
- Android;
- refactor amplo de arquitetura sem impacto direto em validação/hardening.
