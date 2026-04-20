# Secure USB Edition — Release Readiness Gate (distribuição autenticada + matriz mínima)

Objetivo: consolidar release controlada garantindo que a cadeia de confiança da ISO (assinatura + distribuição autenticada da chave pública) e o hardening mínimo não introduziram regressões funcionais.

## 1) Base obrigatória validada

- ISO reproduzível (`build-iso.sh`);
- gate VM (`validate-vm-boot.sh`) como etapa obrigatória antes de pendrive/hardware;
- fluxo físico (`prepare-physical-usb.sh`);
- checklist/matriz de hardware real (`docs/secure-usb-hardware-validation.md`);
- consolidação por `summarize-hardware-validation.sh`.

## 2) Segurança mínima ativa na release controlada

- persistência opcional com bind mounts endurecidos (`nosuid,nodev,noexec`);
- kiosk Chromium mais restritivo para contexto offline-first;
- `bursh-web.service` com sandbox `systemd` e rede limitada a loopback;
- assinatura GPG da ISO + verificação offline obrigatória (`sign-iso.sh`/`verify-iso.sh`).

## 3) Distribuição autenticada da chave pública

### Pacote obrigatório por release

Publicar no **mesmo GitHub Release** (mesma tag):

1. `bursh-secure-usb-amd64.iso`
2. `bursh-secure-usb-amd64.iso.sig`
3. `sha256sums.txt`
4. `bursh-secure-usb-signing-public.asc`

### Regras de autenticação

- expor no corpo da release o fingerprint de `release-signing-key-id.txt`;
- repetir o fingerprint em canal secundário autenticado (runbook interno assinado, portal seguro ou comunicado assinado da equipe);
- proibir distribuição de `infra/usb/keys/offline-signing/`.

### Política de rotação de chave

- rotação programada ao fechar baseline final de release, ou imediata em suspeita/incidente;
- geração do novo par somente em ambiente offline controlado;
- janela curta de transição para chave anterior (apenas validação de artefatos legados);
- toda rotação exige atualização de docs e fingerprint público antes de liberar nova ISO.

## 4) Validação prática pós-assinatura (esta entrega)

Matriz mínima obrigatória executada com registros por cenário via `init-hardware-validation-record.sh --scenario-id`:

- `HW-UEFI-01`
- `HW-UEFI-02`
- `HW-ALT-01`

Consolidação: `summarize-hardware-validation.sh` com resultado final **GO** para aceite mínimo.

## 5) Gate resumido

- **GO (fase atual)**: distribuição autenticada da chave pública definida + assinatura/verificação offline funcionando + matriz mínima consolidada em `GO` sem regressão de hardening.
- **NO-GO**: qualquer falha em assinatura/verificação, boot/kiosk/app local, política de persistência opcional ou ausência de cobertura PASS dos cenários obrigatórios.

## 6) Próximo passo imediato

Com gate `GO` desta entrega, o projeto segue para preparação da baseline final de release da Secure USB Edition (sem abrir escopo de backend/Android/novas features).
