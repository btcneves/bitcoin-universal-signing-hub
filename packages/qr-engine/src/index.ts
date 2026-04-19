import { sha256 } from '@noble/hashes/sha2';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { QRService } from '@bursh/core-domain';
import type { ParsedQRPayload } from '@bursh/shared-types';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map([...BASE58_ALPHABET].map((c, i) => [c, i]));
const PSBT_MAGIC_BYTES = new Uint8Array([0x70, 0x73, 0x62, 0x74, 0xff]);
const BECH32_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const startsWithBytes = (value: Uint8Array, prefix: Uint8Array): boolean => {
  if (value.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i += 1) {
    if (value[i] !== prefix[i]) return false;
  }
  return true;
};

const concatBytes = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
};

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const decodeBase64 = (value: string): Uint8Array | undefined => {
  try {
    const normalized = value.replace(/\s+/g, '');
    const bin = atob(normalized);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  } catch {
    return undefined;
  }
};

const decodeBase58Check = (value: string): Uint8Array | undefined => {
  let num = 0n;
  for (const c of value) {
    const idx = BASE58_MAP.get(c);
    if (idx === undefined) return undefined;
    num = num * 58n + BigInt(idx);
  }

  let hex = num.toString(16);
  if (hex.length % 2) hex = `0${hex}`;

  let out = hex.length > 0 ? hexToBytes(hex) : new Uint8Array([]);
  for (const c of value) {
    if (c === '1') out = concatBytes(new Uint8Array([0]), out);
    else break;
  }
  if (out.length < 4) return undefined;

  const payload = out.subarray(0, -4);
  const checksum = out.subarray(-4);
  const digest = sha256(sha256(payload));
  if (!bytesEqual(digest.subarray(0, 4), checksum)) return undefined;
  return payload;
};

const parseExtPub = (
  value: string
): { type: 'xpub' | 'ypub' | 'zpub'; network: 'mainnet' | 'testnet' } | undefined => {
  const decoded = decodeBase58Check(value);
  if (!decoded || decoded.length !== 78) return undefined;
  const view = new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength);
  const version = view.getUint32(0, false);
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
  const decoded = decodeBase58Check(value);
  if (!decoded || decoded.length < 1) return { ok: false };

  const version = decoded[0];
  if (version === 0x00 || version === 0x05) return { ok: true, network: 'mainnet' };
  if (version === 0x6f || version === 0xc4) return { ok: true, network: 'testnet' };
  return { ok: false };
};

const validateBech32 = (value: string): { ok: boolean; network?: 'mainnet' | 'testnet' } => {
  const normalized = value.trim();
  if (
    !normalized ||
    (normalized !== normalized.toLowerCase() && normalized !== normalized.toUpperCase())
  ) {
    return { ok: false };
  }

  const lower = normalized.toLowerCase();
  const separator = lower.lastIndexOf('1');
  if (separator <= 0 || separator + 7 > lower.length) return { ok: false };

  const prefix = lower.slice(0, separator);
  const data = lower.slice(separator + 1);
  if (prefix !== 'bc' && prefix !== 'tb') return { ok: false };

  if ([...data].some((c) => !BECH32_CHARS.includes(c))) return { ok: false };

  return { ok: true, network: prefix === 'bc' ? 'mainnet' : 'testnet' };
};

const validatePsbtPayload = (input: string): boolean => {
  const trimmed = input.trim();
  const candidate = trimmed.startsWith('ur:crypto-psbt/')
    ? trimmed.slice('ur:crypto-psbt/'.length)
    : trimmed;

  if (/^[0-9a-fA-F]+$/.test(candidate) && candidate.length % 2 === 0) {
    return startsWithBytes(hexToBytes(candidate), PSBT_MAGIC_BYTES);
  }

  const decodedBase64 = decodeBase64(candidate);
  if (!decodedBase64) return false;
  return startsWithBytes(decodedBase64, PSBT_MAGIC_BYTES);
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
