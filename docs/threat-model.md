# Threat Model

Modelo de ameaças consolidado do BURSH (estado atual, abril/2026).

## Ativos críticos

- mnemonic e passphrase
- seed derivada e material de chave privada
- intenção transacional em PSBT
- metadados watch-only (xpub/zpub, endereços, histórico local)

## Atores adversários

- malware no dispositivo online
- atacante de supply chain (dependências/build)
- injeção de payload malicioso via QR/texto
- extração forense local (disco/cache/storage)
- operador/integração externa não confiável

## Superfícies de ataque

1. Input parser (QR, texto, PSBT, invoice).
2. Persistência indevida em storage/caches/logs.
3. Transporte para rede de payloads sensíveis.
4. Dependências e ferramentas de build/CI.

## Mitigações atuais

- segregação por zonas de segurança (0/1/2)
- política explícita de não persistência de material sensível
- validação de payload por tipo e bibliotecas consolidadas
- lint/workflows para reduzir regressão de segurança
- execução preferencial offline-first

## Riscos ainda aceitos

- wipe de memória em JavaScript é mitigação parcial (não garantia forense)
- detecção/parse ainda requer validação funcional em cenários reais de uso
- integração externa real de assinatura/transmissão permanece pendente
- exceção temporária de audit para `GHSA-848j-6mx2-7j84`

## Diretriz de evolução

Cada novo fluxo funcional deve atualizar este documento com:

- ameaça nova introduzida,
- mitigação adotada,
- risco residual aceito e justificativa.
