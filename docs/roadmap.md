# Roadmap

Roadmap prático para evoluir a Secure USB Edition sem expandir escopo.

## Fase atual — operação real em hardware (depois da VM automatizada)

Referências operacionais: `README.md` e `infra/usb/README.md`.

### P0 — Obrigatório agora (Secure USB em pendrive/hardware)

- executar fluxo curto e reproduzível: ISO -> `validate-vm-boot.sh` -> `prepare-physical-usb.sh` -> boot físico;
- aplicar checklist objetivo de PASS/FAIL em hardware real;
- coletar evidência mínima pós-boot com `collect-bursh-boot-evidence.sh`;
- consolidar artefatos para cada execução de hardware (logs + mounts + status de serviços).

### P1 — Próximo passo após hardware validado (hardening / release readiness)

- hardening incremental da live image (defaults mais restritivos e redução de superfície);
- definir critérios formais de aceite para release Secure USB;
- executar matriz mínima de compatibilidade de hardware (UEFI/BIOS e perfis de máquina).

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
