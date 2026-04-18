import { describe, expect, it } from 'vitest';
import { DefaultPsbtService, QrExternalSignerAdapter } from '../src/index';

describe('psbt-engine', () => {
  it('creates and validates psbt payload', () => {
    const svc = new DefaultPsbtService();
    const psbt = svc.createPsbt(['utxo-1'], [{ address: 'bc1qabc', amountSats: 1000 }]);
    expect(svc.validatePsbt(psbt)).toBe(true);
  });

  it('encodes psbt for external signer QR flow', () => {
    const adapter = new QrExternalSignerAdapter();
    const encoded = adapter.exportPsbtToQr('abc123');
    expect(adapter.importSignedPsbtFromQr(encoded)).toBe('abc123');
  });
});
