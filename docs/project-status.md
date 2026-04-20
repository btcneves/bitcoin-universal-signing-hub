# Project status and decision log

Atualizado em: **2026-04-19**.

## 0) Marco de fase (execução manual parcial -> expansão funcional orientada a lacunas)

- **Concluído em 2026-04-19**: preparação de validação manual web (checklist, expected results, template de report, fluxo de bug e issue template) foi finalizada.
- **Rodadas manuais parciais executadas em 2026-04-19**:
  - rodada 1: encontrou bugs reais e acionáveis (falso positivo de Bech32 inválido e falso positivo de PSBT truncada), já corrigidos;
  - rodada 2: consolidou evidência de robustez sem novos bugs.
- rodada 3 (parcial): reforçou consistência de estado/UI, robustez contra payloads inválidos “parecidos” e continuidade offline local, sem bugs novos.
- **Estado atual**: detector e UI mantêm consistência forte com evidência manual real acumulada nas rodadas 1, 2 e 3.
- **Próxima etapa oficial**: fechar trilha de validação/boot da Secure USB Edition até teste real em VM e pendrive, sem abrir novas features web.
- **Regra de origem de bug nesta fase**: issue funcional deve nascer de execução documentada (não de especulação).

## 1) Estado funcional atual do produto web (`apps/web`)

### Funcional hoje (confirmado no código + evidência manual)

- home única renderiza título, subtítulo e painel de entrada universal;
- textarea para colar payload manualmente;
- botão `Limpar payload da memória` com limpeza imediata do campo;
- detecção de tipo de payload em tempo real via `UniversalQrService` para:
  - `bip39` (mnemonic válida);
  - `xpub` / `ypub` / `zpub` (com validação Base58Check);
  - `psbt` (base64/hex/`ur:crypto-psbt` com magic bytes);
  - `lightning_invoice` (prefixos `lnbc` / `lntb`);
  - `bitcoin_address` (Base58 e Bech32 simplificado);
  - `unknown` para não reconhecidos;
- limpeza automática do input quando payload sensível é detectado (`bip39` e `psbt`);
- exibição de erro de parsing na UI quando ocorre exceção do detector;
- transições de estado recentemente confirmadas na rodada 2:
  - `xpub -> ypub -> inválido` sem estado preso;
  - `não sensível -> sensível` com limpeza correta e sem metadado residual;
  - payloads inválidos semelhantes a PSBT/Lightning/address retornando `unknown`;
- reforço de evidência na rodada 3:
  - `ypub` válido com classificação estável e rede mainnet;
  - `cHNidP8BAA`, `bc9...` e `lnxyz123` mantidos como `unknown`;
  - sequências com limpeza/manual e auto-clear sem metadado residual;
  - coerência de fluxos locais em cenário offline mais completo.
- MVP watch-only local após detecção de `xpub` / `ypub` / `zpub`:
  - estado explícito de “watch-only pronto” + etapa local de confirmação;
  - resumo acionável (tipo de extended pubkey, rede, modelo de conta, política de script e escopo de derivação esperado);
  - prévia local sem rede (descriptor redigido + caminhos iniciais de recebimento/troco);
  - transição para estado “watch-only preparado (local)” sem misturar com fluxo sensível;
  - próximos passos de uso sem misturar com fluxo sensível.
- MVP de UX pós-detecção de PSBT:
  - estado explícito de “PSBT pronta para revisão offline” mantendo auto-clear sensível;
  - painel local com formato detectado, tamanho, fingerprint curta e resumo técnico da unsigned tx (versão e contagem de entradas/saídas quando disponível);
  - checkpoint local explícito de revisão concluída, liberando estado “pronta para encaminhamento externo futuro” sem integrar assinatura real;
  - etapa local adicional de preparação de encaminhamento (simulação offline) com token de referência e bloqueio explícito até checkpoint de revisão concluído;
  - separação explícita de etapas na UI: revisão local, exportação futura, assinatura externa futura e validação/finalização futura;
  - orientação objetiva de próximos passos sem assinatura, sem broadcast e sem integração externa nesta etapa.

### Parcial / experimental (existe estrutura, sem validação funcional fim a fim)

- captura de QR por câmera/dispositivo real agora disponível em MVP no web app (modo alternável manual/câmera com fallback); ainda pendente validação ampla entre navegadores/dispositivos heterogêneos;
- cards de ação na home (`Escanear QR`, `Fluxo watch-only`, `Fluxo sensível`, `Configurações`) são informativos, sem navegação nem fluxo transacional;
- watch-only real completo (importação + derivação + visualização operacional com sincronização externa);
- fluxo PSBT completo (review, assinatura externa, roundtrip e broadcast);
- validação de compatibilidade real com wallets/signers externos;
- UX de mensagens e estados ainda mínima (sem assistentes, sem trilha guiada, sem etapas).

### Não implementado ainda (produto)

- integração operacional com assinatura externa de produção;
- fluxo Android funcional;
- pipeline Secure USB pronto para uso de produto (existe fundação executável, ainda faltam hardening e validação ampla);
- suíte de validação manual com evidência contínua automatizada por release gate.

## 2) Estado técnico consolidado (base)

### Já funciona

- install
- lint
- typecheck
- test
- build
- dev
- app web abre localmente
- Secure USB Edition v0 foundation gera ISO live local com autostart+kiosk (dependente de `live-build` no host)

## 2.1) Diagnóstico objetivo — Secure USB no repositório (2026-04-19)

### Já existia antes desta entrega

- `infra/usb/scripts/build-iso.sh` como esqueleto (placeholder textual, sem geração real de ISO);
- script de kiosk e unidade systemd isolados (`infra/usb/overlay/...` e `infra/usb/etc/systemd/...`) sem pipeline live completo;
- referências de roadmap/status citando Secure USB como etapa futura.

### Era placeholder/documentação

- build script anterior não executava `live-build` nem produzia artefato bootável real;
- ausência de política implementada de separação RAM vs persistência em boot;
- ausência de autostart completo (servidor local + browser kiosk + encadeamento de serviços).

### Agora implementado como fundação executável mínima

- pipeline Debian Live com `live-build` em `infra/usb/live-build/config`;
- build reproduzível da ISO (`infra/usb/scripts/build-iso.sh`) com bundle web integrado automaticamente;
- autostart via systemd: init de storage policy -> servidor local -> kiosk fullscreen;
- política operacional de persistência: partição opcional `BURSH-DATA` somente para não sensíveis, sessão sensível em RAM.

## 2.2) Fechamento de trilha prática Secure USB (entrega 2026-04-19)

### Entrega principal escolhida

**Direção única desta entrega:** validação operacional de boot real da Secure USB Edition (ISO -> VM -> pendrive) com smoke test reproduzível.

### O que foi adicionado nesta entrega

- script host para boot em VM (`infra/usb/scripts/run-vm-qemu.sh`), incluindo opção de disco `BURSH-DATA`;
- smoke test no sistema live (`/usr/local/bin/smoke-test-bursh-live.sh`) para validar:
  - serviços de autostart (`bursh-storage-init`, `bursh-web`, `bursh-kiosk`);
  - disponibilidade do app local em `127.0.0.1:4173`;
  - existência de diretório sensível em RAM (`/run/bursh-sensitive`);
  - comportamento de persistência opcional não sensível quando `BURSH-DATA` está presente;
- documentação operacional curta para gerar ISO, testar em VM e testar em pendrive.

### O que já pode ser testado de verdade

- build de ISO local;
- boot em QEMU com e sem disco rotulado `BURSH-DATA`;
- boot por pendrive físico (gravação `dd`);
- verificação objetiva pós-boot via smoke test único.

### O que ainda falta para chamar de “funcional de verdade” (v1 bootável)

- hardening adicional de produção (cadeia de confiança/assinatura da imagem e lockdown incremental);
- rodada estruturada de teste em hardware real heterogêneo com evidência consolidada;
- critérios formais de aceite para release Secure USB além do smoke test de fundação.

## 3) Decisões técnicas consolidadas

1. **Priorizar estabilização técnica antes de expansão funcional**  
   Justificativa: reduzir retrabalho e melhorar auditabilidade.

2. **Offline-first + segregação por zonas (0/1/2)**  
   Justificativa: diminuir exposição de material sensível.

3. **Política explícita de não persistência de segredo**  
   Justificativa: minimizar risco de extração local e vazamento acidental.

4. **Monorepo por módulos de domínio**  
   Justificativa: clareza de fronteiras e evolução incremental por pacote.

## 4) Próxima fase prática (decisão pós rodadas 1, 2 e 3)

### 4.1 O que já está maduro o bastante para sair da fila manual prioritária

1. detecção principal de payloads estáveis já revalidada (`bip39`, `xpub/ypub`, `psbt` válida e inválida, lightning básica e address principal) sem regressões novas na rodada 2 e 3;
2. transições rápidas de estado/UI com limpeza manual e auto-clear sensível já demonstraram consistência operacional suficiente;
3. casos que já provaram estabilidade não devem continuar consumindo rodada manual repetitiva e passam a virar suíte automatizada de regressão.

### 4.2 Lacunas reais restantes (priorizadas, sem abrir escopo)

- **P1**: watch-only além da detecção (fluxo guiado curto, com resultado útil local).
- **P1**: UX pós-detecção para payload sensível/PSBT (mensagem acionável de próximos passos e falhas comuns) **concluída no MVP local**; pendente integração de roundtrip externo controlado.
- **P2**: vetores canônicos faltantes para `zpub` e casos testnet confiáveis (positivo + negativo).
- **P2**: casos PSBT limítrofes com estados/falhas mais ricos e expectativa explícita.
- **P2**: ampliar cobertura de compatibilidade do scan por câmera (browsers/dispositivos) e validar mensagens de fallback.
- **P3**: fluxo signer externo real ponta-a-ponta (após consolidar câmera + P1/P2).

### 4.3 Ordem proposta da próxima fase

1. **P0 (imediato):** converter para automação os cenários manuais que já ficaram estáveis nas rodadas 1, 2 e 3.
2. **P1:** evoluir produto em watch-only real e UX pós-detecção sensível/PSBT (sem integração externa completa).
3. **P2:** fechar vetores canônicos (`zpub`, testnet) e enriquecer matriz de falhas PSBT.
4. **P3:** somente depois avançar signer externo ponta-a-ponta.

### 4.4 Próxima entrega concreta recomendada no repositório

**Entrega escolhida agora:** _trilha operacional mínima Secure USB para teste real de boot (ISO, VM e pendrive) com validação por smoke test._

Escopo objetivo desta entrega:

1. preservar pipeline atual de build ISO e autostart kiosk já existente;
2. incluir execução padronizada de VM para reduzir fricção de validação real;
3. adicionar smoke test pós-boot reproduzível no próprio live system;
4. documentar fluxo curto de gravação em pendrive e checklist de verificação;
5. manter intactas as regras de segurança (sensível em RAM, persistência apenas não sensível);
6. manter fora desta entrega: novas features web, assinatura real, broadcast real, redesign de arquitetura.

## 5) Riscos técnicos ainda abertos

- exceção temporária no audit para `GHSA-848j-6mx2-7j84`;
- uso local de Node 24 pode emitir warning de engine (faixa suportada é `>=20.19 <23`);
- possíveis warnings residuais de browser compatibility devem ser reavaliados a cada release;
- limitações inerentes de wipe de memória em JavaScript (não há garantia forense de eliminação);
- fluxos críticos ainda sem comprovação funcional em ambiente real heterogêneo.

## 6) Exceções temporárias em vigor

- `pnpm audit --prod --ignore GHSA-848j-6mx2-7j84` permanece ativo até decisão formal de remoção da exceção.

## 7) Critério para avanço de fase

A expansão da próxima fase de produto avança com evidência reproduzível incremental da validação funcional web, com foco explícito nas lacunas restantes após as rodadas manuais parciais 1, 2 e 3.
