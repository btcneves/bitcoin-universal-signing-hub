import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Bip84WalletService } from '@bursh/bitcoin-engine';
import { UniversalQrService } from '@bursh/qr-engine';
import {
  buildDetectionSnapshot,
  buildManualClearSnapshot,
  buildWatchOnlyPreparationSnapshot,
  buildWatchOnlySnapshot
} from './App';

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const map = new Map([...alphabet].map((c, i) => [c, i]));

const b58decode = (value: string): Buffer => {
  let num = 0n;
  for (const c of value) num = num * 58n + BigInt(map.get(c) ?? 0);
  let hex = num.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  let out = Buffer.from(hex, 'hex');
  for (const c of value) {
    if (c === '1') out = Buffer.concat([Buffer.from([0]), out]);
    else break;
  }
  return out;
};

const b58encode = (value: Buffer): string => {
  let num = BigInt(`0x${value.toString('hex')}`);
  let out = '';
  while (num > 0n) {
    out = alphabet[Number(num % 58n)] + out;
    num /= 58n;
  }
  for (const byte of value) {
    if (byte === 0) out = `1${out}`;
    else break;
  }
  return out;
};

const recodeVersion = (xpub: string, version: number): string => {
  const raw = b58decode(xpub);
  const payload = Buffer.from(raw.subarray(0, -4));
  payload.writeUInt32BE(version, 0);
  const checksum = createHash('sha256')
    .update(createHash('sha256').update(payload).digest())
    .digest()
    .subarray(0, 4);
  return b58encode(Buffer.concat([payload, checksum]));
};

describe('app flow regressions', () => {
  const parser = new UniversalQrService();
  const wallet = new Bip84WalletService();
  const descriptor = wallet.deriveBip84Wallet(new Uint8Array(64).fill(1));
  const validXpub = descriptor.accountXpub;
  const validYpub = recodeVersion(validXpub, 0x049d7cb2);

  it('cobre payloads validados manualmente: unknown, xpub/ypub/address e inválidos', () => {
    expect(buildDetectionSnapshot(parser, 'texto-livre-123')?.detected?.type).toBe('unknown');

    const invalidSeed =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
    expect(buildDetectionSnapshot(parser, invalidSeed)?.detected?.type).toBe('unknown');

    expect(buildDetectionSnapshot(parser, `${validXpub.slice(0, -1)}x`)?.detected?.type).toBe(
      'unknown'
    );
    expect(buildDetectionSnapshot(parser, 'xpub-lixo-123')?.detected?.type).toBe('unknown');

    expect(buildDetectionSnapshot(parser, validXpub)?.detected?.type).toBe('xpub');
    expect(buildDetectionSnapshot(parser, validYpub)?.detected?.type).toBe('ypub');

    const validAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
    expect(buildDetectionSnapshot(parser, validAddress)?.detected?.type).toBe('bitcoin_address');
    expect(buildDetectionSnapshot(parser, 'bc9qxyz123')?.detected?.type).toBe('unknown');
  });

  it('faz auto-clear de seed/psbt sensível e não limpa em payload não sensível', () => {
    const validSeed =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const seedSnapshot = buildDetectionSnapshot(parser, validSeed);
    expect(seedSnapshot?.detected?.type).toBe('bip39');
    expect(seedSnapshot?.autoClearedSensitiveData).toBe(true);
    expect(seedSnapshot?.scannerInput).toBe('');

    const validPsbt =
      'cHNidP8BADwCAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////wD/////AQAAAAAAAAAAAAAAAAAAAAA=';
    const psbtSnapshot = buildDetectionSnapshot(parser, validPsbt);
    expect(psbtSnapshot?.detected?.type).toBe('psbt');
    expect(psbtSnapshot?.autoClearedSensitiveData).toBe(true);
    expect(psbtSnapshot?.scannerInput).toBe('');

    const unknownSnapshot = buildDetectionSnapshot(parser, 'texto-livre-123');
    expect(unknownSnapshot?.detected?.type).toBe('unknown');
    expect(unknownSnapshot?.autoClearedSensitiveData).toBe(false);
    expect(unknownSnapshot?.scannerInput).toBe('texto-livre-123');
  });

  it('cobre regressão de PSBT truncada e transições rápidas sem estado residual', () => {
    const truncatedPsbt = 'cHNidP8BAHECAAAAAQAAAAAAAAAAAAAAAAAAAA';
    expect(buildDetectionSnapshot(parser, truncatedPsbt)?.detected?.type).toBe('unknown');

    const first = buildDetectionSnapshot(parser, validXpub);
    expect(first?.detected?.type).toBe('xpub');
    expect(first?.detected?.metadata?.network).toBe('mainnet');

    const second = buildDetectionSnapshot(parser, validYpub);
    expect(second?.detected?.type).toBe('ypub');
    expect(second?.detected?.metadata?.network).toBe('mainnet');

    const third = buildDetectionSnapshot(parser, 'lixo-qualquer');
    expect(third?.detected?.type).toBe('unknown');
    expect(third?.detected?.metadata).toBeUndefined();
  });

  it('limpeza manual remove estado anterior sem deixar resíduo', () => {
    const clearWithInput = buildManualClearSnapshot('abc123');
    expect(clearWithInput.scannerInput).toBe('');
    expect(clearWithInput.detected).toBeUndefined();
    expect(clearWithInput.autoClearedSensitiveData).toBe(false);
    expect(clearWithInput.lastActionMessage).toBe('Payload removido da área de teste manual.');

    const clearAlreadyEmpty = buildManualClearSnapshot('   ');
    expect(clearAlreadyEmpty.lastActionMessage).toBe('Área de teste já estava limpa.');
    expect(clearAlreadyEmpty.detected).toBeUndefined();
    expect(clearAlreadyEmpty.errorMessage).toBeUndefined();
  });

  it('gera estado watch-only pronto para xpub/ypub e ignora entradas inválidas', () => {
    const xpubDetected = buildDetectionSnapshot(parser, validXpub)?.detected;
    const xpubWatchOnly = buildWatchOnlySnapshot(xpubDetected);
    expect(xpubWatchOnly.ready).toBe(true);
    expect(xpubWatchOnly.keyType).toBe('xpub');
    expect(xpubWatchOnly.network).toBe('mainnet');
    expect(xpubWatchOnly.accountModel).toContain('xpub');
    expect(xpubWatchOnly.scriptPolicy).toContain('P2PKH');
    expect(xpubWatchOnly.derivationScope).toContain("44'/0'/0'");
    expect(xpubWatchOnly.descriptorPreview).toContain('pkh(');
    expect(xpubWatchOnly.localPreviewPaths).toContain('/0/0 (recebimento)');
    expect(xpubWatchOnly.uiStateMessage).toContain('pronto');

    const ypubDetected = buildDetectionSnapshot(parser, validYpub)?.detected;
    const ypubWatchOnly = buildWatchOnlySnapshot(ypubDetected);
    expect(ypubWatchOnly.ready).toBe(true);
    expect(ypubWatchOnly.keyType).toBe('ypub');
    expect(ypubWatchOnly.network).toBe('mainnet');
    expect(ypubWatchOnly.accountModel).toContain('segwit aninhado');
    expect(ypubWatchOnly.scriptPolicy).toContain('P2WPKH-in-P2SH');
    expect(ypubWatchOnly.derivationScope).toContain("49'/0'/0'");
    expect(ypubWatchOnly.descriptorPreview).toContain('sh(wpkh(');
    expect(ypubWatchOnly.uiStateMessage).toContain('pronto');

    const invalidDetected = buildDetectionSnapshot(parser, 'xpub-lixo-123')?.detected;
    const invalidWatchOnly = buildWatchOnlySnapshot(invalidDetected);
    expect(invalidDetected?.type).toBe('unknown');
    expect(invalidWatchOnly.ready).toBe(false);
    expect(invalidWatchOnly.uiStateMessage).toContain('indisponível');
  });

  it('cobre transição de feedback de preparação watch-only local', () => {
    const xpubDetected = buildDetectionSnapshot(parser, validXpub)?.detected;
    const watchOnly = buildWatchOnlySnapshot(xpubDetected);

    const pending = buildWatchOnlyPreparationSnapshot(watchOnly, false);
    expect(pending.prepared).toBe(false);
    expect(pending.statusLabel).toContain('Pendente');
    expect(pending.guidance).toContain('marque o perfil como preparado');

    const prepared = buildWatchOnlyPreparationSnapshot(watchOnly, true);
    expect(prepared.prepared).toBe(true);
    expect(prepared.statusLabel).toContain('preparado');
    expect(prepared.guidance).toContain('sem seed');

    const unavailable = buildWatchOnlyPreparationSnapshot(
      buildWatchOnlySnapshot(buildDetectionSnapshot(parser, 'invalido')?.detected),
      true
    );
    expect(unavailable.prepared).toBe(false);
    expect(unavailable.statusLabel).toContain('Não preparado');
  });
});
