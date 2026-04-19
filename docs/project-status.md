# Project status and decision log

Atualizado em: **2026-04-19**.

## 1) Estado consolidado do projeto

### Já funciona

- install
- lint
- typecheck
- test
- build
- dev
- app web abre localmente

### Ainda requer validação funcional

- scanner/QR em uso real
- watch-only completo
- PSBT end-to-end
- integração real com carteira externa
- Android
- Secure USB

## 2) Decisões técnicas consolidadas

1. **Priorizar estabilização técnica antes de expansão funcional**  
   Justificativa: reduzir retrabalho e melhorar auditabilidade.

2. **Offline-first + segregação por zonas (0/1/2)**  
   Justificativa: diminuir exposição de material sensível.

3. **Política explícita de não persistência de segredo**  
   Justificativa: minimizar risco de extração local e vazamento acidental.

4. **Monorepo por módulos de domínio**  
   Justificativa: clareza de fronteiras e evolução incremental por pacote.

## 3) Problemas relevantes já resolvidos (ciclo recente)

- pipeline principal consolidado em install/lint/typecheck/test/build;
- workflow de security ativo com audit de produção;
- documentação técnica base criada para arquitetura, threat model e políticas.

## 4) Riscos conhecidos aceitos no estado atual

- exceção temporária no audit para `GHSA-848j-6mx2-7j84`;
- uso local de Node 24 pode emitir warning de engine (faixa suportada é `>=20.19 <23`);
- validação funcional real de fluxos críticos ainda pendente;
- limitações inerentes de wipe de memória em JavaScript.

## 5) Pendências reais restantes (sem inflar escopo)

1. validar scanner/QR em campo (dispositivos e payloads reais);
2. consolidar fluxo watch-only fim a fim;
3. fechar PSBT end-to-end com integração real externa;
4. definir critérios objetivos para início da trilha Android;
5. definir critérios objetivos para maturidade do Secure USB.

## 6) Exceções temporárias em vigor

- `pnpm audit --prod --ignore GHSA-848j-6mx2-7j84` permanece ativo até decisão formal de remoção da exceção.

## 7) Critério para próxima fase

A próxima fase de produto começa quando os itens de validação funcional (scanner, watch-only, PSBT e integração externa) tiverem evidência de execução real reprodutível.
