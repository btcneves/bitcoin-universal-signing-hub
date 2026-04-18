import { describe, expect, it } from 'vitest';
import { Bip39Service, Bip84WalletService } from '../src/index';

describe('BIP39 service', () => {
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('valida checksum oficial (vetor BIP39)', () => {
    const svc = new Bip39Service();
    expect(svc.validateMnemonic(mnemonic)).toBe(true);
    expect(svc.validateMnemonic(`${mnemonic} invalid`)).toBe(false);
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
  it('deriva conta m/84\'/0\'/0\' e endereço m/84\'/0\'/0\'/0/0 real', () => {
    const wallet = new Bip84WalletService();
    const seed = Buffer.from(
      '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1'
      + '9a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4',
      'hex'
    );

    const descriptor = wallet.deriveBip84Wallet(seed);
    const address = wallet.deriveAddress(descriptor.accountZpub, 0, 0);

    expect(descriptor.derivationPath).toBe("m/84'/0'/0'");
    expect(descriptor.accountXpub.startsWith('xpub')).toBe(true);
    expect(descriptor.accountZpub.startsWith('zpub')).toBe(true);
    expect(address).toBe('bc1qcr8te4kr609gcawutmrza0j4xv80jy8zmfp6l0');
  });
});
