import { pbkdf2Sync, createHash } from 'node:crypto';
import type { MnemonicService, WalletService } from '@bursh/core-domain';
import type { WalletDescriptor } from '@bursh/shared-types';

const VALID_WORD_COUNTS = new Set([12, 15, 18, 21, 24]);

export class Bip39Service implements MnemonicService {
  validateMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/g);
    return VALID_WORD_COUNTS.has(words.length) && words.every((w) => w.length >= 2);
  }

  generateSeed(mnemonic: string, passphrase = ''): Uint8Array {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid BIP39 mnemonic length');
    }
    const salt = `mnemonic${passphrase}`;
    return pbkdf2Sync(mnemonic.normalize('NFKD'), salt.normalize('NFKD'), 2048, 64, 'sha512');
  }

  secureWipe(seed: Uint8Array): void {
    seed.fill(0);
  }
}

export class Bip84WalletService implements WalletService {
  deriveBip84Wallet(seed: Uint8Array, account = 0): WalletDescriptor {
    const fingerprint = createHash('sha256').update(seed).update(`${account}`).digest('hex');
    const fakeXpub = `xpub-${fingerprint.slice(0, 80)}`;
    const fakeZpub = `zpub-${fingerprint.slice(16, 96)}`;
    return {
      accountXpub: fakeXpub,
      accountZpub: fakeZpub,
      derivationPath: `m/84'/0'/${account}'`
    };
  }

  deriveAddress(xpub: string, change: 0 | 1, index: number): string {
    const payload = createHash('sha256').update(xpub).update(`${change}/${index}`).digest('hex');
    return `bc1q${payload.slice(0, 38)}`;
  }
}
