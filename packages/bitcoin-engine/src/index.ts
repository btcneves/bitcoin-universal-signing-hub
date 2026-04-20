import { createHash, pbkdf2Sync } from 'node:crypto';
import { HDKey } from '@scure/bip32';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { createBase58check } from '@scure/base';
import { payments } from 'bitcoinjs-lib';
import type { MnemonicService, WalletService } from '@bursh/core-domain';
import type { WalletDescriptor } from '@bursh/shared-types';

const XPUB_VERSION = 0x0488b21e;
const ZPUB_VERSION = 0x04b24746;
const base58check = createBase58check((data: Uint8Array) =>
  createHash('sha256').update(data).digest()
);

const setVersionBytes = (extendedKey: string, version: number): string => {
  const decoded = base58check.decode(extendedKey);
  if (decoded.length !== 78) {
    throw new Error('Extended key inválida');
  }

  const payload = new Uint8Array(decoded);
  payload[0] = (version >>> 24) & 0xff;
  payload[1] = (version >>> 16) & 0xff;
  payload[2] = (version >>> 8) & 0xff;
  payload[3] = version & 0xff;
  return base58check.encode(payload);
};

const normalizeToXpub = (extPub: string): string => {
  const decoded = base58check.decode(extPub);
  if (decoded.length !== 78) {
    throw new Error('XPUB/ZPUB inválida');
  }

  const version = new DataView(decoded.buffer, decoded.byteOffset, 4).getUint32(0, false);
  if (version === XPUB_VERSION) return extPub;
  if (version === ZPUB_VERSION) return setVersionBytes(extPub, XPUB_VERSION);

  throw new Error('Versão de extended key não suportada');
};

export class Bip39Service implements MnemonicService {
  validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic.normalize('NFKD'), wordlist);
  }

  generateSeed(mnemonic: string, passphrase = ''): Uint8Array {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Mnemonic inválido para BIP39');
    }

    return pbkdf2Sync(
      mnemonic.normalize('NFKD'),
      `mnemonic${passphrase}`.normalize('NFKD'),
      2048,
      64,
      'sha512'
    );
  }

  secureWipe(seed: Uint8Array): void {
    seed.fill(0);
  }
}

export class Bip84WalletService implements WalletService {
  deriveBip84Wallet(seed: Uint8Array, account = 0): WalletDescriptor {
    const master = HDKey.fromMasterSeed(seed);
    const accountNode = master.derive(`m/84'/0'/${account}'`);

    if (!accountNode.publicExtendedKey) {
      throw new Error('Falha ao derivar chave pública estendida');
    }

    return {
      accountXpub: accountNode.publicExtendedKey,
      accountZpub: setVersionBytes(accountNode.publicExtendedKey, ZPUB_VERSION),
      derivationPath: `m/84'/0'/${account}'`
    };
  }

  deriveAddress(xpub: string, change: 0 | 1, index: number): string {
    const normalizedXpub = normalizeToXpub(xpub);
    const accountNode = HDKey.fromExtendedKey(normalizedXpub);
    const childNode = accountNode.deriveChild(change).deriveChild(index);

    if (!childNode.publicKey) {
      throw new Error('Falha ao derivar chave pública');
    }

    const payment = payments.p2wpkh({ pubkey: Buffer.from(childNode.publicKey) });
    if (!payment.address) {
      throw new Error('Falha ao gerar endereço SegWit');
    }

    return payment.address;
  }
}

export type SupportedSeedCoin = 'bitcoin' | 'litecoin' | 'dogecoin';

export type SeedVerificationRequest = {
  mnemonic: string;
  passphrase?: string;
  derivationPath?: string;
  coin?: SupportedSeedCoin;
  addressCount?: number;
  knownAddressToMatch?: string;
};

export type SeedVerificationResult = {
  coin: SupportedSeedCoin;
  derivationPath: string;
  accountXpub: string;
  accountSlip132?: string;
  addresses: string[];
  knownAddressMatched: boolean;
  knownAddressChecked?: string;
};

export type MultiCoinSeedVerificationResult = {
  bitcoin: SeedVerificationResult;
  litecoin: SeedVerificationResult;
  dogecoin: SeedVerificationResult;
};

export type PassphraseConsistencyResult = {
  derivationPath: string;
  xpubWithoutPassphrase: string;
  xpubWithPassphrase: string;
  matchesWithoutPassphrase: boolean;
};

const getDefaultDerivationPath = (coin: SupportedSeedCoin): string => {
  switch (coin) {
    case 'bitcoin':
      return "m/84'/0'/0'";
    case 'litecoin':
      return "m/84'/2'/0'";
    case 'dogecoin':
      return "m/44'/3'/0'";
    default:
      return "m/84'/0'/0'";
  }
};

const clampAddressCount = (count?: number): number => {
  if (!Number.isInteger(count) || !count) return 5;
  return Math.min(Math.max(count, 1), 20);
};

const fromQrOrRaw = (payload: string): string => {
  const trimmed = payload.trim();
  if (trimmed.startsWith('ur:crypto-seed/')) return trimmed.slice('ur:crypto-seed/'.length).trim();
  if (trimmed.startsWith('ur:crypto-passphrase/')) {
    return trimmed.slice('ur:crypto-passphrase/'.length).trim();
  }
  return trimmed;
};

export class OfflineSeedVerificationService {
  private readonly bip39 = new Bip39Service();

  private static deriveAddressForCoin(
    accountXpub: string,
    coin: SupportedSeedCoin,
    index: number
  ): string {
    const accountNode = HDKey.fromExtendedKey(normalizeToXpub(accountXpub));
    const childNode = accountNode.deriveChild(0).deriveChild(index);

    if (!childNode.publicKey) {
      throw new Error('Falha ao derivar chave pública para endereço');
    }

    const pubkey = Buffer.from(childNode.publicKey);
    if (coin === 'bitcoin') {
      const payment = payments.p2wpkh({ pubkey });
      if (!payment.address) throw new Error('Falha ao gerar endereço Bitcoin');
      return payment.address;
    }

    if (coin === 'litecoin') {
      const payment = payments.p2wpkh({
        pubkey,
        network: {
          messagePrefix: '\x19Litecoin Signed Message:\n',
          bech32: 'ltc',
          bip32: { public: XPUB_VERSION, private: 0x0488ade4 },
          pubKeyHash: 0x30,
          scriptHash: 0x32,
          wif: 0xb0
        }
      });
      if (!payment.address) throw new Error('Falha ao gerar endereço Litecoin');
      return payment.address;
    }

    const payment = payments.p2pkh({
      pubkey,
      network: {
        messagePrefix: '\x19Dogecoin Signed Message:\n',
        bech32: 'doge',
        bip32: { public: 0x02facafd, private: 0x02fac398 },
        pubKeyHash: 0x1e,
        scriptHash: 0x16,
        wif: 0x9e
      }
    });
    if (!payment.address) throw new Error('Falha ao gerar endereço Dogecoin');
    return payment.address;
  }

  verifySeed(request: SeedVerificationRequest): SeedVerificationResult {
    const coin = request.coin ?? 'bitcoin';
    const defaultPath = getDefaultDerivationPath(coin);
    const derivationPath = request.derivationPath?.trim() || defaultPath;
    const addressCount = clampAddressCount(request.addressCount);

    const seed = this.bip39.generateSeed(request.mnemonic, request.passphrase ?? '');
    try {
      const master = HDKey.fromMasterSeed(seed);
      const accountNode = master.derive(derivationPath);
      if (!accountNode.publicExtendedKey) {
        throw new Error('Falha ao derivar chave pública estendida');
      }

      const accountXpub = accountNode.publicExtendedKey;
      const accountSlip132 =
        coin === 'bitcoin' ? setVersionBytes(accountXpub, ZPUB_VERSION) : undefined;
      const addresses = Array.from({ length: addressCount }, (_, i) =>
        OfflineSeedVerificationService.deriveAddressForCoin(accountXpub, coin, i)
      );
      const knownAddressChecked = request.knownAddressToMatch?.trim();

      const result: SeedVerificationResult = {
        coin,
        derivationPath,
        accountXpub,
        addresses,
        knownAddressMatched: !!knownAddressChecked && addresses.includes(knownAddressChecked)
      };
      if (accountSlip132) result.accountSlip132 = accountSlip132;
      if (knownAddressChecked) result.knownAddressChecked = knownAddressChecked;
      return result;
    } finally {
      this.bip39.secureWipe(seed);
    }
  }

  verifyAllCoins(request: Omit<SeedVerificationRequest, 'coin'>): MultiCoinSeedVerificationResult {
    return {
      bitcoin: this.verifySeed({ ...request, coin: 'bitcoin' }),
      litecoin: this.verifySeed({ ...request, coin: 'litecoin' }),
      dogecoin: this.verifySeed({ ...request, coin: 'dogecoin' })
    };
  }

  verifySeedFromInput(
    request: Omit<SeedVerificationRequest, 'mnemonic' | 'passphrase'> & {
      mnemonicInput: string;
      passphraseInput?: string;
    }
  ): SeedVerificationResult {
    const mnemonic = fromQrOrRaw(request.mnemonicInput);
    const passphrase = request.passphraseInput ? fromQrOrRaw(request.passphraseInput) : undefined;

    return this.verifySeed({
      ...request,
      mnemonic,
      ...(passphrase !== undefined ? { passphrase } : {})
    });
  }

  evaluatePassphraseConsistency(
    mnemonic: string,
    passphrase: string,
    derivationPath = "m/84'/0'/0'"
  ): PassphraseConsistencyResult {
    const withoutPassphrase = this.verifySeed({
      mnemonic,
      passphrase: '',
      derivationPath,
      coin: 'bitcoin',
      addressCount: 1
    });
    const withPassphrase = this.verifySeed({
      mnemonic,
      passphrase,
      derivationPath,
      coin: 'bitcoin',
      addressCount: 1
    });

    return {
      derivationPath,
      xpubWithoutPassphrase: withoutPassphrase.accountXpub,
      xpubWithPassphrase: withPassphrase.accountXpub,
      matchesWithoutPassphrase: withoutPassphrase.accountXpub === withPassphrase.accountXpub
    };
  }

  confirmPassphraseByXpub(
    mnemonic: string,
    passphrase: string,
    expectedXpub: string,
    derivationPath = "m/84'/0'/0'"
  ): boolean {
    const result = this.verifySeed({
      mnemonic,
      passphrase,
      derivationPath,
      coin: 'bitcoin',
      addressCount: 1
    });
    return result.accountXpub === expectedXpub || result.accountSlip132 === expectedXpub;
  }
}

export const encodeXpubForQr = (xpub: string): string => `ur:crypto-hdkey/${xpub.trim()}`;
export const decodeXpubFromQr = (payload: string): string =>
  payload.startsWith('ur:crypto-hdkey/') ? payload.slice('ur:crypto-hdkey/'.length) : payload;

export const encodeSeedForQr = (mnemonic: string): string => `ur:crypto-seed/${mnemonic.trim()}`;
export const decodeSeedFromQr = (payload: string): string =>
  payload.startsWith('ur:crypto-seed/') ? payload.slice('ur:crypto-seed/'.length) : payload;

export const encodePassphraseForQr = (passphrase: string): string =>
  `ur:crypto-passphrase/${passphrase.trim()}`;
export const decodePassphraseFromQr = (payload: string): string =>
  payload.startsWith('ur:crypto-passphrase/')
    ? payload.slice('ur:crypto-passphrase/'.length)
    : payload;
