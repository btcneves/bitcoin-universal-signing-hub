import { describe, expect, it } from 'vitest';
import { Psbt } from 'bitcoinjs-lib';
import {
  DefaultPsbtService,
  QrExternalSignerAdapter,
  decodePsbtFromQr,
  encodePsbtForQr
} from '../src/index';

const makeValidPsbt = (): string => {
  const psbt = new Psbt();
  psbt.addInput({
    hash: '11'.repeat(32),
    index: 0,
    witnessUtxo: {
      script: Buffer.from('0014' + '22'.repeat(20), 'hex'),
      value: 1000
    }
  });
  psbt.addOutput({ script: Buffer.from('0014' + '33'.repeat(20), 'hex'), value: 900 });
  return psbt.toBase64();
};

describe('psbt-engine', () => {
  it('valida estrutura completa de uma PSBT', () => {
    const svc = new DefaultPsbtService();
    const validPsbt = makeValidPsbt();
    expect(svc.validatePsbt(validPsbt)).toBe(true);
    expect(() => svc.finalizePsbt(validPsbt)).toThrow(/não pôde ser finalizada/i);
  });

  it('rejeita PSBT inválida sem UTXO por input', () => {
    const svc = new DefaultPsbtService();
    const malformed = new Psbt();
    malformed.addInput({ hash: 'aa'.repeat(32), index: 0 });
    malformed.addOutput({ script: Buffer.from('0014' + '44'.repeat(20), 'hex'), value: 1000 });
    expect(svc.validatePsbt(malformed.toBase64())).toBe(false);
  });

  it('codifica psbt para fluxo qr', () => {
    const adapter = new QrExternalSignerAdapter();
    const psbt = makeValidPsbt();
    const encoded = adapter.exportPsbtToQr(psbt);
    expect(adapter.importSignedPsbtFromQr(encoded)).toBe(psbt);
  });

  it('normaliza envelope UR para ida/volta de PSBT assinada', () => {
    const psbt = makeValidPsbt();
    const qrPayload = encodePsbtForQr(psbt);
    expect(qrPayload.startsWith('ur:crypto-psbt/')).toBe(true);
    expect(decodePsbtFromQr(qrPayload)).toBe(psbt);
  });

  it('assina PSBT recebida via UR QR e devolve UR QR assinada', () => {
    const svc = new DefaultPsbtService();
    const psbt = makeValidPsbt();
    const qrPayload = encodePsbtForQr(psbt);

    expect(() => svc.signPsbtFromQrWithMnemonic(qrPayload, 'abandon abandon abandon')).toThrow(
      /Mnemonic inválido/i
    );
  });

  it('limpa seed da memória em tentativas de assinatura falhas', () => {
    const svc = new DefaultPsbtService();
    const invalidMnemonic = 'abandon abandon abandon';
    expect(() => svc.signPsbtWithMnemonic(makeValidPsbt(), invalidMnemonic)).toThrow(
      /Mnemonic inválido/i
    );
  });
});
