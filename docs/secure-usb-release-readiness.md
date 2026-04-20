# Secure USB Edition — Release Readiness Gate (hardening inicial)

Objetivo: manter a fundação validada, confirmar hardening mínimo sem regressão e iniciar cadeia mínima de confiança da ISO para release controlada.

## 1) Base já validada (permanece obrigatória)

- ISO reproduzível (`build-iso.sh`);
- gate VM em `PASS` (`validate-vm-boot.sh` + artefatos);
- fluxo físico com `prepare-physical-usb.sh`;
- checklist/matriz de hardware real executável (`docs/secure-usb-hardware-validation.md`);
- evidência consolidada por rodada (`summarize-hardware-validation.sh`).

## 2) Hardening coberto nesta entrega

- mount policy mais restritiva para persistência opcional (`nosuid,nodev,noexec` também nos bind mounts de `watch-only` e `config`);
- kiosk Chromium com defaults offline/dedicado mais restritivos (menos networking/background);
- `bursh-web.service` endurecido com sandbox `systemd` e rede limitada a loopback;
- assinatura GPG da ISO no pipeline de build + verificação offline (`sign-iso.sh`/`verify-iso.sh`).

## 3) Checklist pós-hardening + confiança de artefato (curto)

1. gerar/rotacionar chave dedicada de assinatura (`generate-iso-signing-key.sh`) em ambiente controlado;
2. build gera `iso` + `iso.sig` automaticamente;
3. verificação offline da assinatura (`verify-iso.sh`) retorna `PASS` antes de VM/pendrive;
4. boot em VM e hardware continua funcional;
5. app responde em `http://127.0.0.1:4173`;
6. `bursh-web.service` ativo como `bursh`;
7. `BURSH-DATA` opcional mantém persistência apenas em `watch-only/config`;
8. smoke/evidência continuam gerando saída sem regressão.

## 4) O que ainda falta para release pronta para uso controlado

- rodada ampliada de compatibilidade em hardware real (além da matriz mínima);
- fechamento de baseline por candidate release (execução repetida + evidência contínua);
- processo operacional de distribuição da chave pública por canal autenticado e política de rotação periódica.

## Gate resumido

- **GO (fase atual)**: base validada + hardening inicial ativo + assinatura/verificação de ISO em funcionamento + matriz mínima sem regressão funcional.
- **NO-GO**: regressão de assinatura/verificação da ISO, boot/kiosk/app local ou perda de isolamento definido para persistência opcional.
