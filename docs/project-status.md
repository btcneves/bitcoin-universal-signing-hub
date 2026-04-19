# Project status and decision log

Atualizado em: **2026-04-19**.

## 0) Marco de fase (preparação -> execução manual)

- **Concluído em 2026-04-19**: preparação de validação manual web (checklist, expected results, template de report, fluxo de bug e issue template) está finalizada.
- **Próxima etapa oficial**: execução real da checklist com coleta de evidências por caso e abertura de bugs funcionais baseados em observação real.
- **Regra de origem de bug nesta fase**: issue funcional deve nascer de execução documentada (não de especulação).

## 1) Estado funcional atual do produto web (`apps/web`)

### Funcional hoje (confirmado no código)

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
- exibição de erro de parsing na UI quando ocorre exceção do detector.

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

## 4) Próxima fase prática (execução manual real)

### P0 — executar e registrar

1. executar `docs/web-functional-checklist.md` conforme `docs/run-first-manual-web-validation.md`;
2. registrar evidência por caso no `docs/web-test-report-template.md`;
3. abrir bugs funcionais somente para falhas/parciais observadas, com rastreabilidade (`WF-*` + commit + evidência).

### P1 — corrigir bloqueios reais encontrados

1. corrigir divergências estáveis que degradam o fluxo principal com workaround;
2. reexecutar casos impactados e atualizar evidência.

### P2 — tratar inconsistências não bloqueantes

1. ajustar problemas de clareza/UX/heurística/experimental sem risco direto;
2. manter backlog priorizado por impacto observado na rodada.

## 5) Riscos técnicos ainda abertos

- exceção temporária no audit para `GHSA-848j-6mx2-7j84`;
- uso local de Node 24 pode emitir warning de engine (faixa suportada é `>=20.19 <23`);
- possíveis warnings residuais de browser compatibility devem ser reavaliados a cada release;
- limitações inerentes de wipe de memória em JavaScript (não há garantia forense de eliminação);
- fluxos críticos ainda sem comprovação funcional em ambiente real heterogêneo.

## 6) Exceções temporárias em vigor

- `pnpm audit --prod --ignore GHSA-848j-6mx2-7j84` permanece ativo até decisão formal de remoção da exceção.

## 7) Critério para avanço de fase

A próxima fase de produto só avança quando houver evidência reproduzível da validação funcional web (checklist completo), com pendências remanescentes priorizadas por risco real.
