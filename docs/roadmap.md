# Roadmap

Roadmap prático para evoluir a Secure USB Edition sem expandir escopo.

## Fase atual — operação real em hardware (depois da VM automatizada)

Referências operacionais: `README.md` e `infra/usb/README.md`.

### P0 — Obrigatório agora (aceite mínimo profissional em hardware)

- executar fluxo curto e reproduzível: ISO -> `validate-vm-boot.sh` -> `prepare-physical-usb.sh` -> boot físico;
- aplicar checklist formal com critérios `PASS/FAIL/BLOCKED` (`docs/secure-usb-hardware-validation.md`);
- rodar matriz mínima obrigatória (UEFI sem/ com `BURSH-DATA` + hardware alternativo);
- gerar registro-base por execução com `init-hardware-validation-record.sh`;
- coletar evidência mínima pós-boot com `collect-bursh-boot-evidence.sh` e registrar caminho do `.tar.gz`.

### P1 — Próximo passo após aceite mínimo (hardening / release readiness)

- hardening incremental da live image (defaults mais restritivos e redução de superfície);
- ampliar matriz de compatibilidade para candidatos de release;
- evoluir gate funcional para gate de release externo completo.

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
