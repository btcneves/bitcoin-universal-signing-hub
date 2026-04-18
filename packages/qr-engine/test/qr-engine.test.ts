import { describe, expect, it } from 'vitest';
import { UniversalQrService } from '../src/index';

describe('QR parser', () => {
  const parser = new UniversalQrService();

  it('detects BIP39 mnemonic', () => {
    const input = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    expect(parser.detectPayload(input).type).toBe('bip39');
  });

  it('detects lnbc invoice', () => {
    expect(parser.detectPayload('lnbc10u1pn9...').type).toBe('lightning_invoice');
  });
});
