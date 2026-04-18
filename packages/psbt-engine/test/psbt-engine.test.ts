import { describe, expect, it } from 'vitest';
import { DefaultPsbtService, QrExternalSignerAdapter } from '../src/index';

const minimalPsbt = Buffer.from([
  0x70, 0x73, 0x62, 0x74, 0xff,
  0x01, 0x00,
  0x02, 0x00, 0x00,
  0x00
]).toString('base64');

describe('psbt-engine', () => {
  it('detecta payload com mágico psbt\\xff e parse estrutural', () => {
    const svc = new DefaultPsbtService();
    expect(svc.validatePsbt(minimalPsbt)).toBe(true);
    expect(svc.finalizePsbt(minimalPsbt)).toContain('inputs=0');
  });

  it('codifica psbt para fluxo qr', () => {
    const adapter = new QrExternalSignerAdapter();
    const encoded = adapter.exportPsbtToQr(minimalPsbt);
    expect(adapter.importSignedPsbtFromQr(encoded)).toBe(minimalPsbt);
  });
});
