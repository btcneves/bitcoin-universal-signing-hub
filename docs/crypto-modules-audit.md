# Auditoria Técnica dos Módulos Criptográficos

## BIP39

- **Implementado:** validação de mnemonic pela wordlist oficial e derivação de seed via PBKDF2-HMAC-SHA512 (2048 rounds).  
- **Garantia da biblioteca:** `@scure/bip39` valida checksum e normalização UTF-8/NFKD da frase.  
- **Dependência de runtime:** confirmação de compatibilidade entre versões Node/WebCrypto em ambientes alvo.  
- **Não coberto:** geração de mnemonic no app e testes end-to-end no browser.

## BIP32/BIP84

- **Implementado:** derivação de conta `m/84'/0'/account'`, conversão XPUB/ZPUB e derivação de endereço segwit por índice/change.  
- **Garantia da biblioteca:** `@scure/bip32` implementa HD wallet BIP32; `bitcoinjs-lib` constrói output p2wpkh válido.  
- **Dependência de runtime:** validação cruzada com vetores oficiais em ambientes de produção.  
- **Não coberto:** testnet account variants, hardened edge-cases e import/export de descritores completos.

## Validação de endereço

- **Implementado:** detecção Base58Check e Bech32/Bech32m com validação de prefixo e tamanho de witness program.  
- **Garantia da biblioteca:** `bitcoinjs-lib` oferece parse robusto para Base58 e Bech32.  
- **Dependência de runtime:** testes com corpus ampliado de endereços inválidos/malformados.  
- **Não coberto:** cobertura completa de versões futuras e networks customizadas.

## PSBT

- **Implementado:** decode base64/hex e validação estrutural mínima (unsigned tx, inputs/outputs, witness/nonwitness utxo rules).  
- **Garantia da biblioteca:** `bitcoinjs-lib` parseia PSBT conforme BIP174 em nível de estrutura.  
- **Dependência de runtime:** assinatura/finalização real com hardware signer e nós Bitcoin para validar consenso.  
- **Não coberto:** política de fees, script policies, SIGHASH restrictions e validação de rede/UTXO real.

## BOLT11

- **Implementado:** parse de invoice, validação de integridade completa e extração de campos principais.  
- **Garantia da biblioteca:** `bolt11` valida assinatura/checksum e expõe tags normalizadas.  
- **Dependência de runtime:** testes com invoices reais de provedores distintos e variações multi-part.  
- **Não coberto:** política de roteamento, liquidez e pagamento Lightning (apenas parsing).
