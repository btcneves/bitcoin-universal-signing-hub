# Project status and decision log

Atualizado em: **2026-04-19**.

## 0) Marco de fase (execução manual parcial -> expansão funcional orientada a lacunas)

- **Concluído em 2026-04-19**: preparação de validação manual web (checklist, expected results, template de report, fluxo de bug e issue template) foi finalizada.
- **Rodadas manuais parciais executadas em 2026-04-19**:
  - rodada 1: encontrou bugs reais e acionáveis (falso positivo de Bech32 inválido e falso positivo de PSBT truncada), já corrigidos;
  - rodada 2: consolidou evidência de robustez sem novos bugs.
- rodada 3 (parcial): reforçou consistência de estado/UI, robustez contra payloads inválidos “parecidos” e continuidade offline local, sem bugs novos.
- **Estado atual**: detector e UI mantêm consistência forte com evidência manual real acumulada nas rodadas 1, 2 e 3.
- **Próxima etapa oficial**: rodada funcional focada nas lacunas ainda não cobertas (evitar repetir casos já estáveis).
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

### Parcial / experimental (existe estrutura, sem validação funcional fim a fim)

- captura de QR por câmera/dispositivo real (atualmente entrada é por texto colado);
- cards de ação na home (`Escanear QR`, `Fluxo watch-only`, `Fluxo sensível`, `Configurações`) são informativos, sem navegação nem fluxo transacional;
- watch-only real (importação + derivação + visualização operacional);
- fluxo PSBT completo (review, assinatura externa, roundtrip e broadcast);
- validação de compatibilidade real com wallets/signers externos;
- UX de mensagens e estados ainda mínima (sem assistentes, sem trilha guiada, sem etapas).

### Não implementado ainda (produto)

- integração operacional com assinatura externa de produção;
- fluxo Android funcional;
- pipeline Secure USB pronto para uso de produto;
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

## 3) Decisões técnicas consolidadas

1. **Priorizar estabilização técnica antes de expansão funcional**  
   Justificativa: reduzir retrabalho e melhorar auditabilidade.

2. **Offline-first + segregação por zonas (0/1/2)**  
   Justificativa: diminuir exposição de material sensível.

3. **Política explícita de não persistência de segredo**  
   Justificativa: minimizar risco de extração local e vazamento acidental.

4. **Monorepo por módulos de domínio**  
   Justificativa: clareza de fronteiras e evolução incremental por pacote.

## 4) Próxima fase prática (rodada 4 funcional focada em lacunas reais)

### P0 — consolidar evidência das rodadas 1, 2 e 3

1. manter registros objetivos das rodadas em `docs/web-manual-validation-round-1.md`, `docs/web-manual-validation-round-2.md` e `docs/web-manual-validation-round-3.md`;
2. preservar rastreabilidade dos bugs reais já corrigidos da rodada 1;
3. refletir no checklist/expected-results os casos estáveis já validados e os inconclusivos.

### P1 — cobrir lacunas funcionais prioritárias (sem abrir novas frentes)

1. `zpub` com vetor garantido (positivo + negativo);
2. casos adicionais de rede/testnet (address e extended pubkeys);
3. watch-only mais profundo (além da detecção, sem integração completa externa);
4. offline menos trivial em sequência de interações locais com foco em regressão funcional;
5. UX de erro e feedback com foco em mensagens acionáveis;
6. PSBT adicional (quase-válidas, limítrofes e comportamento de orientação na UI).

### P2 — tratar inconsistências não bloqueantes

1. ajustar problemas de clareza/UX/heurística/experimental sem risco direto;
2. manter backlog priorizado por impacto observado em execução real.

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
