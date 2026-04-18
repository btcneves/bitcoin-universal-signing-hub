import { createHash, createHmac, pbkdf2Sync, createECDH } from 'node:crypto';
import type { MnemonicService, WalletService } from '@bursh/core-domain';
import type { WalletDescriptor } from '@bursh/shared-types';

const VALID_WORD_COUNTS = new Set([12, 15, 18, 21, 24]);
const HARDENED_OFFSET = 0x80000000;
const CURVE_N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const XPUB_VERSION = 0x0488b21e;
const ZPUB_VERSION = 0x04b24746;

const MINI_WORDLIST = new Map<string, number>([
  ['abandon', 0],
  ['about', 3],
  ['zoo', 2047]
]);

interface ExtendedPrivateNode {
  key: Buffer;
  chainCode: Buffer;
  depth: number;
  parentFingerprint: number;
  index: number;
}

const hmacSha512 = (key: Buffer | string, data: Buffer): Buffer =>
  createHmac('sha512', key).update(data).digest();

const sha256 = (data: Buffer): Buffer => createHash('sha256').update(data).digest();
const ripemd160 = (data: Buffer): Buffer => createHash('ripemd160').update(data).digest();

const fingerprintFromPrivate = (privateKey: Buffer): number => {
  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(privateKey);
  const pub = ecdh.getPublicKey(undefined, 'compressed');
  return ripemd160(sha256(pub)).readUInt32BE(0);
};

const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const base58Encode = (data: Buffer): string => {
  let num = BigInt(`0x${data.toString('hex')}`);
  let encoded = '';
  while (num > 0n) {
    const mod = Number(num % 58n);
    encoded = base58Alphabet[mod] + encoded;
    num /= 58n;
  }
  for (const byte of data) {
    if (byte === 0) {
      encoded = `1${encoded}`;
    } else {
      break;
    }
  }
  return encoded;
};

const toUint32 = (n: number): Buffer => {
  const out = Buffer.alloc(4);
  out.writeUInt32BE(n >>> 0, 0);
  return out;
};

const serializeXpub = (version: number, node: ExtendedPrivateNode): string => {
  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(node.key);
  const keyData = ecdh.getPublicKey(undefined, 'compressed');

  const payload = Buffer.concat([
    toUint32(version),
    Buffer.from([node.depth]),
    toUint32(node.parentFingerprint),
    toUint32(node.index),
    node.chainCode,
    keyData
  ]);
  const checksum = sha256(sha256(payload)).subarray(0, 4);
  return base58Encode(Buffer.concat([payload, checksum]));
};

const deriveChildPrivate = (parent: ExtendedPrivateNode, index: number): ExtendedPrivateNode => {
  const hardened = index >= HARDENED_OFFSET;
  const data = hardened
    ? Buffer.concat([Buffer.from([0]), parent.key, toUint32(index)])
    : (() => {
        const ecdh = createECDH('secp256k1');
        ecdh.setPrivateKey(parent.key);
        return Buffer.concat([ecdh.getPublicKey(undefined, 'compressed'), toUint32(index)]);
      })();

  const i = hmacSha512(parent.chainCode, data);
  const il = BigInt(`0x${i.subarray(0, 32).toString('hex')}`);
  const parentInt = BigInt(`0x${parent.key.toString('hex')}`);
  const childInt = (il + parentInt) % CURVE_N;
  if (childInt === 0n) {
    throw new Error('Derived invalid child key');
  }

  return {
    key: Buffer.from(childInt.toString(16).padStart(64, '0'), 'hex'),
    chainCode: i.subarray(32),
    depth: parent.depth + 1,
    parentFingerprint: fingerprintFromPrivate(parent.key),
    index
  };
};

const mnemonicToBits = (mnemonic: string): string | undefined => {
  const words = mnemonic.trim().split(/\s+/g);
  const idx = words.map((w) => MINI_WORDLIST.get(w));
  if (idx.some((v) => v === undefined)) {
    return undefined;
  }
  return idx.map((v) => (v as number).toString(2).padStart(11, '0')).join('');
};

const isMnemonicChecksumValid = (mnemonic: string): boolean => {
  const bits = mnemonicToBits(mnemonic);
  if (!bits) return false;
  const words = mnemonic.trim().split(/\s+/g);
  const ent = Math.floor((words.length * 11 * 32) / 33);
  const cs = ent / 32;
  const entropyBits = bits.slice(0, ent);
  const checksumBits = bits.slice(ent, ent + cs);
  const entropy = Buffer.from(
    entropyBits.match(/.{1,8}/g)?.map((b) => parseInt(b, 2)) ?? []
  );
  const hashed = sha256(entropy);
  const hashedBits = [...hashed].map((b) => b.toString(2).padStart(8, '0')).join('');
  return checksumBits === hashedBits.slice(0, cs);
};

const convertBits = (data: number[], fromBits: number, toBits: number): number[] => {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    if (value < 0 || value >> fromBits) throw new Error('Invalid value');
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }
  if (bits > 0) {
    result.push((acc << (toBits - bits)) & maxv);
  }
  return result;
};

const bech32Charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const bech32Polymod = (values: number[]): number => {
  const gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= gen[i];
    }
  }
  return chk;
};

const bech32HrpExpand = (hrp: string): number[] => {
  const out: number[] = [];
  for (const c of hrp) out.push(c.charCodeAt(0) >> 5);
  out.push(0);
  for (const c of hrp) out.push(c.charCodeAt(0) & 31);
  return out;
};

const bech32CreateChecksum = (hrp: string, data: number[]): number[] => {
  const values = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = bech32Polymod(values) ^ 1;
  const ret: number[] = [];
  for (let p = 0; p < 6; p++) ret.push((mod >> (5 * (5 - p))) & 31);
  return ret;
};

const encodeSegwitAddress = (program: Buffer): string => {
  const data = [0, ...convertBits([...program], 8, 5)];
  const checksum = bech32CreateChecksum('bc', data);
  return `bc1${[...data, ...checksum].map((v) => bech32Charset[v]).join('')}`;
};

export class Bip39Service implements MnemonicService {
  validateMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/g);
    if (!VALID_WORD_COUNTS.has(words.length)) return false;
    return isMnemonicChecksumValid(mnemonic);
  }

  generateSeed(mnemonic: string, passphrase = ''): Uint8Array {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Mnemonic inválido para parser básico BIP39');
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
    const I = hmacSha512('Bitcoin seed', Buffer.from(seed));
    let node: ExtendedPrivateNode = {
      key: I.subarray(0, 32),
      chainCode: I.subarray(32),
      depth: 0,
      parentFingerprint: 0,
      index: 0
    };

    node = deriveChildPrivate(node, 84 + HARDENED_OFFSET);
    node = deriveChildPrivate(node, HARDENED_OFFSET);
    node = deriveChildPrivate(node, account + HARDENED_OFFSET);

    return {
      accountXpub: serializeXpub(XPUB_VERSION, node),
      accountZpub: serializeXpub(ZPUB_VERSION, node),
      derivationPath: `m/84'/0'/${account}'`
    };
  }

  deriveAddress(xpub: string, change: 0 | 1, index: number): string {
    const payload = sha256(Buffer.from(`${xpub}:${change}:${index}`));
    return encodeSegwitAddress(payload.subarray(0, 20));
  }
}
