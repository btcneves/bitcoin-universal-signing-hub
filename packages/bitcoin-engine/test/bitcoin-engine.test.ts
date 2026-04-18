import { describe, expect, it } from 'vitest';
import { Bip39Service, Bip84WalletService } from '../src/index';

describe('BIP39 service', () => {
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  it('validates known word count', () => {
    const svc = new Bip39Service();
    expect(svc.validateMnemonic(mnemonic)).toBe(true);
  });

  it('generates deterministic seed', () => {
    const svc = new Bip39Service();
    const a = svc.generateSeed(mnemonic, 'pass');
    const b = svc.generateSeed(mnemonic, 'pass');
    expect(Buffer.from(a).toString('hex')).toBe(Buffer.from(b).toString('hex'));
  });
});

describe('BIP84 wallet service', () => {
  it('derives bc1 address', () => {
    const wallet = new Bip84WalletService();
    const descriptor = wallet.deriveBip84Wallet(new Uint8Array(64).fill(7));
    expect(descriptor.derivationPath).toContain("m/84'/0'/0'");
    expect(wallet.deriveAddress(descriptor.accountXpub, 0, 0)).toMatch(/^bc1q/);
  });
});
