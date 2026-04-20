# Roadmap

Roadmap prático para evoluir o produto após estabilização técnica inicial.

## Fase atual — Fechar trilha de validação/boot da Secure USB Edition

Referência de execução: `docs/web-functional-checklist.md`.

### P0 — Obrigatório agora (Secure USB)

- gerar ISO live local de forma reproduzível;
- validar boot em VM (QEMU) com smoke test pós-boot;
- validar gravação/boot por pendrive físico com o mesmo smoke test;
- registrar evidência objetiva de autostart kiosk/app e política de persistência não sensível.

### P1 — Consolidação imediata após P0

- ampliar checklist de hardware real (UEFI/BIOS, GPU, Wi‑Fi/Bluetooth desativado quando aplicável);
- aplicar hardening incremental na imagem live (defaults mais restritivos, redução de superfície e trilha de auditoria);
- formalizar critérios de aceite para versão bootável “funcional de verdade”.

### P2 — Retomar evolução de produto (após trilha USB estabilizada)

- integração real com assinador externo em cenário reproduzível;
- critérios de release de segurança e funcionalidade para uso controlado;
- evolução adicional de UX web somente com base em lacunas comprovadas em validação real.

### P3 — Expansão de plataforma (após gate funcional)

- Android;
- Secure USB para release de produção (assinatura de imagem, cadeia de confiança e operação guiada).

## Itens explicitamente fora da etapa atual

- novas features grandes fora do escopo de validação funcional;
- refactors amplos sem ganho direto de validação/clareza;
- redesign amplo de arquitetura antes de consolidar boot/teste real da Secure USB.
