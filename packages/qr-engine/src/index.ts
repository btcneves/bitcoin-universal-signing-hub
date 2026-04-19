import { createHash } from 'node:crypto';
import { address as btcAddress, Psbt } from 'bitcoinjs-lib';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { QRService } from '@bursh/core-domain';
import type { ParsedQRPayload } from '@bursh/shared-types';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map([...BASE58_ALPHABET].map((c, i) => [c, i]));

const decodeBase58Check = (value: string): Buffer | undefined => {
  let num = 0n;
  for (const c of value) {
    const idx = BASE58_MAP.get(c);
    if (idx === undefined) return undefined;
    num = num * 58n + BigInt(idx);
  }

  let hex = num.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  let out = Buffer.from(hex, 'hex');
  for (const c of value) {
    if (c === '1') out = Buffer.concat([Buffer.from([0]), out]);
    else break;
  }
  if (out.length < 4) return undefined;

  const payload = out.subarray(0, -4);
  const checksum = out.subarray(-4);
  const digest = createHash('sha256')
    .update(createHash('sha256').update(payload).digest())
    .digest();
  if (!digest.subarray(0, 4).equals(checksum)) return undefined;
  return payload;
};

const parseExtPub = (
  value: string
): { type: 'xpub' | 'ypub' | 'zpub'; network: 'mainnet' | 'testnet' } | undefined => {
  const decoded = decodeBase58Check(value);
  if (!decoded || decoded.length !== 78) return undefined;
  const version = decoded.readUInt32BE(0);
  const table: Record<number, { type: 'xpub' | 'ypub' | 'zpub'; network: 'mainnet' | 'testnet' }> =
    {
      0x0488b21e: { type: 'xpub', network: 'mainnet' },
      0x049d7cb2: { type: 'ypub', network: 'mainnet' },
      0x04b24746: { type: 'zpub', network: 'mainnet' },
      0x043587cf: { type: 'xpub', network: 'testnet' }
    };
  return table[version];
};

const validateBase58Address = (value: string): { ok: boolean; network?: 'mainnet' | 'testnet' } => {
  try {
    const decoded = btcAddress.fromBase58Check(value);
    if ([0x00, 0x05].includes(decoded.version)) return { ok: true, network: 'mainnet' };
    if ([0x6f, 0xc4].includes(decoded.version)) return { ok: true, network: 'testnet' };
    return { ok: false };
  } catch {
    return { ok: false };
  }
};

const validateBech32 = (value: string): { ok: boolean; network?: 'mainnet' | 'testnet' } => {
  try {
    const decoded = btcAddress.fromBech32(value);
    const network =
      decoded.prefix === 'bc' ? 'mainnet' : decoded.prefix === 'tb' ? 'testnet' : undefined;
    if (!network) return { ok: false };

    if (decoded.version < 0 || decoded.version > 16) return { ok: false };
    if (decoded.data.length < 2 || decoded.data.length > 40) return { ok: false };
    if (decoded.version === 0 && ![20, 32].includes(decoded.data.length)) return { ok: false };
    if (decoded.version > 0 && decoded.data.length < 2) return { ok: false };

    return { ok: true, network };
  } catch {
    return { ok: false };
  }
};

const validatePsbtPayload = (input: string): boolean => {
  const trimmed = input.trim();
  const candidate = trimmed.startsWith('ur:crypto-psbt/')
    ? trimmed.slice('ur:crypto-psbt/'.length)
    : trimmed;

  try {
    if (/^[0-9a-fA-F]+$/.test(candidate)) {
      Psbt.fromHex(candidate);
      return true;
    }

    Psbt.fromBase64(candidate);
    return true;
  } catch {
    return false;
  }
};

const validateBip39Mnemonic = (input: string): boolean => {
  const normalized = input.trim().replace(/\s+/g, ' ');
  const words = normalized.split(' ');
  if (![12, 15, 18, 21, 24].includes(words.length)) return false;
  return validateMnemonic(normalized.normalize('NFKD'), wordlist);
};

export class UniversalQrService implements QRService {
  detectPayload(input: string): ParsedQRPayload {
    const trimmed = input.trim();

    if (validateBip39Mnemonic(trimmed)) {
      return { type: 'bip39', raw: trimmed };
    }

    const extPub = parseExtPub(trimmed);
    if (extPub) {
      return { type: extPub.type, raw: trimmed, metadata: { network: extPub.network } };
    }

    if (trimmed.startsWith('lnbc') || trimmed.startsWith('lntb')) {
      return { type: 'lightning_invoice', raw: trimmed };
    }

    if (validatePsbtPayload(trimmed)) {
      return { type: 'psbt', raw: trimmed };
    }

    const bech = validateBech32(trimmed);
    const base58 = validateBase58Address(trimmed);
    if (bech.ok || base58.ok) {
      return {
        type: 'bitcoin_address',
        raw: trimmed,
        metadata: { network: bech.network ?? base58.network ?? 'mainnet' }
      };
    }

    return { type: 'unknown', raw: trimmed };
  }

  encodePayload(input: string): string {
    return input;
  }
}
