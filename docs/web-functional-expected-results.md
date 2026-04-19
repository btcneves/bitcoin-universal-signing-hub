# Web app — expected results by flow

Atualizado em: **2026-04-19**.

Este guia complementa a checklist funcional e descreve, por fluxo, o comportamento esperado da UI atual (`apps/web`) durante testes manuais locais.

## Convenções

- **Deve acontecer**: comportamento esperado para considerar o teste aprovado.
- **Não deve acontecer**: comportamento considerado bug/regressão.
- **Status atual**: nível de maturidade no estado atual do produto.

## Fluxos principais

### 1) Input manual de texto (genérico)

- **Deve acontecer**
  - O campo aceita colagem e edição manual.
  - O estado de detecção atualiza sem travar a página.
- **Não deve acontecer**
  - Crash de runtime ao colar texto aleatório.
  - Congelamento perceptível para entradas curtas/médias.
- **Status atual**: **estável para uso manual básico**.

### 2) Seed válida (BIP39)

- **Deve acontecer**
  - Tipo detectado: `bip39`.
  - Aviso explícito de limpeza de sensível.
  - Campo de entrada é limpo automaticamente após detecção.
- **Não deve acontecer**
  - Seed permanecer visível após detecção.
  - Classificação como `unknown` quando seed válida.
- **Status atual**: **funcional e priorizado para higiene mínima de UI**.

### 3) Seed inválida

- **Deve acontecer**
  - Tipo detectado: `unknown`.
  - Campo **não** é limpo automaticamente (não foi detectado como sensível válido).
- **Não deve acontecer**
  - Classificação incorreta como `bip39`.
  - Aviso de limpeza sensível sem detecção de sensível.
- **Status atual**: **funcional (checagem BIP39 local)**.

### 4) xpub válido (inclui ypub/zpub)

- **Deve acontecer**
  - Tipo detectado correspondente (`xpub`, `ypub` ou `zpub`).
  - Estado visual de payload reconhecido.
- **Não deve acontecer**
  - Classificação como `unknown` para payload válido.
- **Status atual**: **funcional para validação de formato/checksum**.

### 5) xpub inválido

- **Deve acontecer**
  - Tipo detectado: `unknown`.
- **Não deve acontecer**
  - Falso positivo como `xpub`/`ypub`/`zpub`.
- **Status atual**: **funcional (não deve aceitar checksum/version errados)**.

### 6) PSBT válida

- **Deve acontecer**
  - Tipo detectado: `psbt`.
  - Aviso de limpeza sensível exibido.
  - Campo limpo automaticamente.
- **Não deve acontecer**
  - PSBT ficar persistida no textarea após detecção.
- **Status atual**: **funcional para assinatura de tipo por magic bytes**.

### 7) PSBT inválida

- **Deve acontecer**
  - Tipo detectado: `unknown`.
  - Sem aviso de limpeza sensível.
- **Não deve acontecer**
  - Falso positivo como `psbt`.
- **Status atual**: **funcional para casos inválidos comuns**.

### 8) Lightning invoice válida

- **Deve acontecer**
  - Tipo detectado: `lightning_invoice`.
- **Não deve acontecer**
  - Classificação incorreta como `unknown` quando prefixo válido e formato básico preservado.
- **Status atual**: **parcial/heurístico** (detecção por prefixo).

### 9) Lightning invoice inválida

- **Deve acontecer**
  - Tipo detectado: `unknown` para prefixo inválido.
- **Não deve acontecer**
  - Classificação como invoice com prefixos não suportados.
- **Status atual**: **parcial/heurístico** (texto truncado com prefixo válido ainda pode passar).

### 10) Bitcoin address válida

- **Deve acontecer**
  - Tipo detectado: `bitcoin_address`.
  - Quando disponível, exibir rede detectada (`mainnet`/`testnet`).
- **Não deve acontecer**
  - Falso negativo para exemplos válidos Bech32/Base58 comuns.
- **Status atual**: **funcional para validação de formato/checksum suportado**.

### 11) Bitcoin address inválida

- **Deve acontecer**
  - Tipo detectado: `unknown`.
- **Não deve acontecer**
  - Falso positivo para checksum inválido ou caracteres fora do alfabeto.
- **Status atual**: **funcional para invalidações básicas**.

### 12) Limpeza de sensíveis

- **Deve acontecer**
  - Apenas tipos sensíveis (`bip39`, `psbt`) limpam input automaticamente.
  - Mensagem deixa explícito que houve limpeza automática.
  - Botão de limpeza manual remove input + estado de detecção/erro.
- **Não deve acontecer**
  - Limpeza automática em payload não sensível.
  - Persistência acidental em LocalStorage/SessionStorage pelo app.
- **Status atual**: **funcional para UX mínima de segurança em teste manual**.

## Resumo de maturidade atual

- **Estável para validação manual agora**: input manual, seed, xpub, PSBT, endereço Bitcoin, limpeza de sensíveis.
- **Parcial/experimental**: validação semântica completa de Lightning invoice (detecção atual é heurística).
- **Fora do escopo desta rodada**: fluxo watch-only completo, assinatura externa real, integração QR avançada ponta-a-ponta.
