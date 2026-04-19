import { describe, expect, it } from 'vitest';
import { Bip84WalletService } from '@bursh/bitcoin-engine';
import { UniversalQrService } from '@bursh/qr-engine';

describe('app flow', () => {
  const parser = new UniversalQrService();
  const wallet = new Bip84WalletService();
  const validXpub = wallet.deriveBip84Wallet(new Uint8Array(64).fill(1)).accountXpub;

  it('detecta payload xpub válido', () => {
    expect(parser.detectPayload(validXpub).type).toBe('xpub');
  });

  it('não classifica xpub inválido como válido', () => {
    const invalidXpub = `${validXpub.slice(0, -1)}x`;

    expect(parser.detectPayload(invalidXpub).type).toBe('unknown');
  });
});
