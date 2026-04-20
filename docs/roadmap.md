# Roadmap

Roadmap prático para evoluir a Secure USB Edition sem expandir escopo.

## Fase atual — consolidação final da release controlada

Referências operacionais: `README.md` e `infra/usb/README.md`.

### P0 — Obrigatório agora (fechado nesta entrega)

- manter fluxo ISO -> VM -> pendrive -> hardware sem regressão;
- hardening mínimo de runtime ativo (loopback-only, sandbox de serviço local, defaults kiosk restritivos);
- assinatura de ISO no build e verificação offline operacional;
- distribuição autenticada da chave pública junto da release assinada;
- matriz mínima (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`) consolidada com gate `GO`.

### P1 — Próximo passo (baseline final de release)

- repetir campanha da matriz mínima para baseline final da versão candidata;
- ampliar cobertura em hardware heterogêneo mantendo o mesmo checklist/gate;
- validar operação da política de rotação da chave pública sem quebrar verificações offline.

### P2 — Release readiness ampliado (sem abrir feature nova)

- trilha de evidência contínua para auditoria de boot/runtime;
- baseline de operação repetível para versão candidata a release;
- revisão final de documentação operacional para handoff externo.

## Itens explicitamente fora da etapa atual

- signing real;
- backend;
- Android;
- novas funcionalidades web;
- refactor amplo de arquitetura sem impacto direto em validação/hardening.
