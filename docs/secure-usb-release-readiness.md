# Secure USB Edition — Release Readiness Gate (curto)

Objetivo: separar claramente o que já é base funcional validável do que ainda é hardening/produção.

## 1) Fundação funcional validada (o que precisa estar pronto agora)

Checklist para declarar “funcional de verdade” nesta fase:

- ISO gerada localmente (`build-iso.sh`);
- gate em VM com `validate-vm-boot.sh` em `PASS`;
- execução da matriz mínima de hardware real com aceite mínimo (`docs/secure-usb-hardware-validation.md`);
- registros padronizados preenchidos por execução;
- consolidação agregada das rodadas físicas via `summarize-hardware-validation.sh`;
- evidências `.tar.gz` anexáveis por execução obrigatória.

Se tudo acima estiver verde, a Secure USB Edition é considerada **funcional para validação operacional real**.

## 2) Pendências de hardening (próxima fase, sem bloquear esta entrega)

- hardening incremental de runtime/live image (defaults mais restritivos);
- revisão de superfície de ataque e lockdown adicional;
- políticas extras de integridade/cadeia de confiança da imagem.

## 3) Pendências de produção/release

- rodada maior de compatibilidade em hardware heterogêneo;
- trilha de evidência contínua por candidate release;
- critérios finais de go/no-go para distribuição externa.

## Gate resumido de aceite

- **GO (fase atual):** fundação funcional validada + evidências consolidadas.
- **Critério operacional de GO:** relatório agregado (`infra/usb/dist/hardware-validation/summary.md`) retorna `Result: GO`.
- **NO-GO (fase atual):** qualquer cenário obrigatório da matriz em `FAIL` ou sem evidência.
