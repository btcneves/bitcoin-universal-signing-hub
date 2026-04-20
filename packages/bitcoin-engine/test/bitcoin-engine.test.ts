import { describe, expect, it } from 'vitest';
import {
  Bip39Service,
  Bip84WalletService,
  OfflineSeedVerificationService,
  decodePassphraseFromQr,
  decodeSeedFromQr,
  decodeXpubFromQr,
  encodePassphraseForQr,
  encodeSeedForQr,
  encodeXpubForQr
} from '../src/index';

describe('BIP39 service', () => {
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('valida checksum oficial (vetor BIP39)', () => {
    const svc = new Bip39Service();
    expect(svc.validateMnemonic(mnemonic)).toBe(true);
    expect(svc.validateMnemonic(`${mnemonic} invalid`)).toBe(false);
  });

  it('gera seed BIP39 com passphrase (NFKD)', () => {
    const svc = new Bip39Service();
    const seed = Buffer.from(svc.generateSeed(mnemonic, 'TREZOR')).toString('hex');
    expect(seed).toBe(
      'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e5349553' +
        '1f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04'
    );
  });
});

describe('BIP84 wallet service', () => {
  it("deriva conta m/84'/0'/0' e endereço m/84'/0'/0'/0/0 real", () => {
    const wallet = new Bip84WalletService();
    const seed = Buffer.from(
      '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1' +
        '9a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4',
      'hex'
    );

    const descriptor = wallet.deriveBip84Wallet(seed);
    const address = wallet.deriveAddress(descriptor.accountZpub, 0, 0);

    expect(descriptor.derivationPath).toBe("m/84'/0'/0'");
    expect(descriptor.accountXpub.startsWith('xpub')).toBe(true);
    expect(descriptor.accountZpub.startsWith('zpub')).toBe(true);
    expect(address).toBe('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
  });
});

describe('offline seed verification service', () => {
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('deriva xpub e primeiros endereços sem persistir segredo', () => {
    const svc = new OfflineSeedVerificationService();
    const result = svc.verifySeed({
      mnemonic,
      passphrase: 'TREZOR',
      coin: 'bitcoin',
      derivationPath: "m/84'/0'/0'",
      addressCount: 2,
      knownAddressToMatch: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu'
    });

    expect(result.accountXpub.startsWith('xpub')).toBe(true);
    expect(result.accountSlip132?.startsWith('zpub')).toBe(true);
    expect(result.addresses).toHaveLength(2);
    expect(result.knownAddressMatched).toBe(false);
  });

  it('suporta entrada via QR para seed/passphrase e derivação multi-moeda', () => {
    const svc = new OfflineSeedVerificationService();

    const byQr = svc.verifySeedFromInput({
      mnemonicInput: encodeSeedForQr(mnemonic),
      passphraseInput: encodePassphraseForQr('TREZOR'),
      coin: 'bitcoin',
      derivationPath: "m/84'/0'/0'",
      addressCount: 1
    });
    expect(byQr.accountXpub.startsWith('xpub')).toBe(true);

    const multi = svc.verifyAllCoins({
      mnemonic: encodeSeedForQr(mnemonic),
      passphrase: encodePassphraseForQr('TREZOR'),
      addressCount: 1
    });
    expect(multi.bitcoin.addresses[0]?.startsWith('bc1')).toBe(true);
    expect(multi.litecoin.addresses[0]?.startsWith('ltc1')).toBe(true);
    expect(multi.dogecoin.addresses[0]?.startsWith('D')).toBe(true);

    expect(decodeSeedFromQr(encodeSeedForQr(mnemonic))).toBe(mnemonic);
    expect(decodePassphraseFromQr(encodePassphraseForQr('TREZOR'))).toBe('TREZOR');
  });

  it('rejeita QR com prefixo inesperado, truncado ou vazio em seed/passphrase', () => {
    const svc = new OfflineSeedVerificationService();
    const validPsbtUr = 'ur:crypto-psbt/cHNidP8BAHECAAAAAQ==';

    expect(() =>
      svc.verifySeedFromInput({
        mnemonicInput: validPsbtUr,
        coin: 'bitcoin'
      })
    ).toThrow(/prefixo incompatível/i);

    expect(() =>
      svc.verifySeedFromInput({
        mnemonicInput: 'ur:crypto-seed/   ',
        coin: 'bitcoin'
      })
    ).toThrow(/payload ausente/i);

    expect(() =>
      svc.verifyAllCoins({
        mnemonic: 'ur:crypto-hdkey/xpub123',
        passphrase: '',
        addressCount: 1
      })
    ).toThrow(/prefixo incompatível/i);
  });

  it('avalia consistência de passphrase comparando xpub com/sem passphrase', () => {
    const svc = new OfflineSeedVerificationService();
    const empty = svc.evaluatePassphraseConsistency(mnemonic, '');
    expect(empty.matchesWithoutPassphrase).toBe(true);

    const nonEmpty = svc.evaluatePassphraseConsistency(mnemonic, 'TREZOR');
    expect(nonEmpty.matchesWithoutPassphrase).toBe(false);
    expect(nonEmpty.xpubWithPassphrase).not.toBe(nonEmpty.xpubWithoutPassphrase);
  });

  it('confirma passphrase por equivalência de xpub e suporta QR envelope de xpub', () => {
    const svc = new OfflineSeedVerificationService();
    const expected = svc.verifySeed({
      mnemonic,
      passphrase: 'secret',
      derivationPath: "m/84'/0'/0'"
    });

    expect(
      svc.confirmPassphraseByXpub(mnemonic, 'secret', expected.accountXpub, "m/84'/0'/0'")
    ).toBe(true);
    expect(
      svc.confirmPassphraseByXpub(mnemonic, 'wrong', expected.accountXpub, "m/84'/0'/0'")
    ).toBe(false);

    const payload = encodeXpubForQr(expected.accountXpub);
    expect(decodeXpubFromQr(payload)).toBe(expected.accountXpub);
    expect(() => decodeXpubFromQr('ur:crypto-seed/abc')).toThrow(/prefixo incompatível/i);
    expect(() => decodeXpubFromQr('ur:crypto-hdkey/   ')).toThrow(/payload ausente/i);
  });
});
