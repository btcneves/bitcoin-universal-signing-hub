# Roadmap

Roadmap prático para evoluir o produto após estabilização técnica inicial.

## Fase atual — Validação funcional web (gate obrigatório)

Referência de execução: `docs/web-functional-checklist.md`.

### P0 — Obrigatório agora

- executar checklist funcional completo no app local e registrar evidências;
- classificar cada fluxo como funcional, parcial ou não implementado;
- abrir issues objetivas para cada falha encontrada com payload de reprodução.

### P1 — Próxima entrega de produto (curto prazo)

- refinamento do fluxo QR/payload detection (entrada, feedback e robustez);
- watch-only local pós-detecção evoluído com resumo de escopo/descriptor e estado “preparado” offline; próximo passo é UX navegável com export/import controlado sem rede;
- PSBT UX e roundtrip local com integração externa mínima validada.

### P2 — Consolidação operacional

- integração real com assinador externo em cenário reproduzível;
- critérios de release de segurança e funcionalidade para uso controlado.

### P3 — Expansão de plataforma (após gate funcional)

- Android;
- Secure USB.

## Itens explicitamente fora da etapa atual

- novas features grandes fora do escopo de validação funcional;
- refactors amplos sem ganho direto de validação/clareza;
- avanço de Android/USB antes de conclusão do gate funcional web.
