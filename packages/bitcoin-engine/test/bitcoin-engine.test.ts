import { describe, expect, it } from 'vitest';
import { Bip39Service, Bip84WalletService } from '../src/index';

describe('BIP39 service', () => {
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('valida checksum oficial (vetor BIP39)', () => {
    const svc = new Bip39Service();
    expect(svc.validateMnemonic(mnemonic)).toBe(true);
  });

  it('gera seed BIP39 com passphrase (NFKD)', () => {
    const svc = new Bip39Service();
    const seed = Buffer.from(svc.generateSeed(mnemonic, 'TREZOR')).toString('hex');
    expect(seed).toBe(
      'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e5349553'
      + '1f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04'
    );
  });
});

describe('BIP84 wallet service', () => {
  it('gera descritor m/84\'/0\'/0\' e endereço bc1 válido', () => {
    const wallet = new Bip84WalletService();
    const seed = new Uint8Array(64).fill(1);
    const descriptor = wallet.deriveBip84Wallet(seed);
    const address = wallet.deriveAddress(descriptor.accountXpub, 0, 0);

    expect(descriptor.derivationPath).toBe("m/84'/0'/0'");
    expect(descriptor.accountXpub.startsWith('xpub')).toBe(true);
    expect(descriptor.accountZpub.startsWith('zpub')).toBe(true);
    expect(address.startsWith('bc1')).toBe(true);
  });
});
