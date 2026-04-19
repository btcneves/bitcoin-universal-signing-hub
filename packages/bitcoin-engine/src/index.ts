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
    const childNode = accountNode.derive(`${change}/${index}`);

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
