# Roadmap

Roadmap resumido para a próxima fase do produto após estabilização técnica inicial.

## Fase 1 — Validação funcional real (prioridade)

- validar scanner/QR em cenário real (câmera, iluminação, ruído e payloads variados);
- fechar fluxo watch-only completo com UX consistente;
- validar PSBT end-to-end com carteiras/signer externos reais;
- formalizar matriz de compatibilidade de integrações prioritárias.

## Fase 2 — Segurança aplicada e hardening

- reforçar cobertura de redaction e telemetria segura em todo fluxo;
- ampliar testes adversariais (payloads malformados e inputs hostis);
- consolidar critérios de release para execução segura em ambiente operacional.

## Fase 3 — Expansão de plataformas

- evoluir trilha Android com mesmos requisitos de segurança e validação;
- amadurecer pipeline Secure USB com foco em reprodutibilidade e cadeia de confiança;
- preparar base para transição de “projeto validado” para “produto operacional”.

## Itens explicitamente fora da etapa atual

- novas features de produto sem validação funcional da base;
- refactors amplos sem ganho direto de clareza/segurança;
- avanço de Android/USB sem critérios mínimos da Fase 1 atendidos.
