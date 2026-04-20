# Roadmap

Roadmap prático para evoluir a Secure USB Edition sem expandir escopo.

## Fase atual — hardening final inicial para release candidata (depois da matriz mínima)

Referências operacionais: `README.md` e `infra/usb/README.md`.

### P0 — Obrigatório agora (hardening mínimo + confiança de artefato)

- manter fluxo ISO -> VM -> pendrive -> hardware sem regressão;
- aplicar hardening mínimo de runtime com impacto alto e baixo risco (loopback-only, sandbox de serviço local, defaults kiosk restritivos);
- validar persistência opcional com mount options endurecidas (`nosuid,nodev,noexec`);
- executar checklist curto pós-hardening junto do smoke/evidência;
- consolidar rodada física em `summary.md` para confirmar que hardening não quebrou o gate `GO`/`NO-GO`;
- assinar ISO no build e verificar assinatura offline antes de VM/pendrive.

### P1 — Próximo passo (release candidate controlada)

- ampliar cobertura em hardware heterogêneo com mesmas políticas endurecidas;
- fechar baseline de candidate release por versão de ISO assinada;
- formalizar rotação operacional da chave pública sem expandir produto.

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
