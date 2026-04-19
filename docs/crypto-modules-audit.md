# Auditoria técnica dos módulos criptográficos

Estado consolidado em abril/2026. Este documento registra o que já está implementado, o que depende de validação funcional real e o que ainda está fora de escopo imediato.

## BIP39

- **Implementado:** validação de mnemonic e derivação de seed (PBKDF2-HMAC-SHA512, 2048 rounds).
- **Dependência de validação real:** comportamento completo em fluxos web reais (input/UX/limpeza em diferentes browsers).
- **Pendente:** cobertura E2E completa de recuperação guiada por usuário final.

## BIP32/BIP84

- **Implementado:** derivação de conta `m/84'/0'/account'`, conversões de chave pública estendida e geração de endereço segwit.
- **Dependência de validação real:** comparação ampliada com vetores e carteiras externas de referência.
- **Pendente:** expansão de casos limítrofes e variantes adicionais de rede.

## Validação de endereço Bitcoin

- **Implementado:** parse/validação de Base58Check e Bech32/Bech32m com checagens estruturais principais.
- **Dependência de validação real:** corpus amplo de entradas inválidas/maliciosas em uso operacional.
- **Pendente:** cobertura aprofundada para cenários avançados e futuras extensões.

## PSBT

- **Implementado:** decode e validação estrutural mínima de payloads.
- **Dependência de validação real:** assinatura/finalização/transmissão com stack externa real.
- **Pendente:** fluxo end-to-end completo com integração prática de carteira/signer.

## BOLT11

- **Implementado:** parsing e validação de integridade de invoices.
- **Dependência de validação real:** variação de invoices de múltiplos provedores e cenários adversariais.
- **Pendente:** execução de pagamento/roteamento (não é foco da fase atual).

## Conclusão objetiva

A base criptográfica e de parsing está funcional para inspeção e evolução técnica controlada. O principal gap atual está na validação funcional end-to-end em ambiente real, não na ausência de estrutura base.
