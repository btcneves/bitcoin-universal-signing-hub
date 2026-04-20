# Secure USB Edition — Release Readiness Gate (hardening inicial)

Objetivo: manter a fundação validada e iniciar o hardening mínimo obrigatório para candidate release controlada.

## 1) Base já validada (permanece obrigatória)

- ISO reproduzível (`build-iso.sh`);
- gate VM em `PASS` (`validate-vm-boot.sh` + artefatos);
- fluxo físico com `prepare-physical-usb.sh`;
- checklist/matriz de hardware real executável (`docs/secure-usb-hardware-validation.md`);
- evidência consolidada por rodada (`summarize-hardware-validation.sh`).

## 2) Hardening coberto nesta entrega

- mount policy mais restritiva para persistência opcional (`nosuid,nodev,noexec` também nos bind mounts de `watch-only` e `config`);
- kiosk Chromium com defaults offline/dedicado mais restritivos (menos networking/background);
- `bursh-web.service` endurecido com sandbox `systemd` e rede limitada a loopback.

## 3) Checklist pós-hardening (curto)

1. boot em VM e hardware continua funcional;
2. app responde em `http://127.0.0.1:4173`;
3. `bursh-web.service` ativo como `bursh`;
4. `BURSH-DATA` opcional mantém persistência apenas em `watch-only/config`;
5. smoke/evidência continuam gerando saída sem regressão.

## 4) O que ainda falta para release pronta para uso controlado

- rodada ampliada de compatibilidade em hardware real (além da matriz mínima);
- fechamento de baseline por candidate release (execução repetida + evidência contínua);
- cadeia mínima de confiança de imagem/distribuição (assinatura/verificação de artefato) em fase separada.

## Gate resumido

- **GO (fase atual)**: base validada + hardening inicial ativo + matriz mínima sem regressão funcional.
- **NO-GO**: regressão de boot/kiosk/app local ou perda de isolamento definido para persistência opcional.
