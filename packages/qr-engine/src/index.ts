import { createHash } from 'node:crypto';
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
  const digest = createHash('sha256').update(createHash('sha256').update(payload).digest()).digest();
  if (!digest.subarray(0, 4).equals(checksum)) return undefined;
  return payload;
};

const parseExtPub = (value: string): { type: 'xpub' | 'ypub' | 'zpub'; network: 'mainnet' | 'testnet' } | undefined => {
  const decoded = decodeBase58Check(value);
  if (!decoded || decoded.length !== 78) return undefined;
  const version = decoded.readUInt32BE(0);
  const table: Record<number, { type: 'xpub' | 'ypub' | 'zpub'; network: 'mainnet' | 'testnet' }> = {
    0x0488b21e: { type: 'xpub', network: 'mainnet' },
    0x049d7cb2: { type: 'ypub', network: 'mainnet' },
    0x04b24746: { type: 'zpub', network: 'mainnet' },
    0x043587cf: { type: 'xpub', network: 'testnet' }
  };
  return table[version];
};

const validateBase58Address = (value: string): boolean => {
  const decoded = decodeBase58Check(value);
  return !!decoded && (decoded[0] === 0x00 || decoded[0] === 0x05 || decoded[0] === 0x6f || decoded[0] === 0xc4);
};

const validateBech32 = (value: string): { ok: boolean; network?: 'mainnet' | 'testnet' } => {
  const lower = value.toLowerCase();
  if (!lower.startsWith('bc1') && !lower.startsWith('tb1')) return { ok: false };
  const hrp = lower.startsWith('bc1') ? 'mainnet' : 'testnet';
  const data = lower.slice(3);
  if (data.length < 10) return { ok: false };
  const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  if ([...data].some((c) => !charset.includes(c))) return { ok: false };
  return { ok: true, network: hrp };
};

const isPsbtPayload = (input: string): boolean => {
  const trimmed = input.trim();
  if (trimmed.startsWith('ur:crypto-psbt/')) return true;
  const raw = Buffer.from(trimmed, 'base64');
  return raw.subarray(0, 5).equals(Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]));
};

export class UniversalQrService implements QRService {
  detectPayload(input: string): ParsedQRPayload {
    const trimmed = input.trim();
    const words = trimmed.split(/\s+/);
    if ([12, 15, 18, 21, 24].includes(words.length)) {
      return { type: 'bip39', raw: trimmed };
    }

    const extPub = parseExtPub(trimmed);
    if (extPub) {
      return { type: extPub.type, raw: trimmed, metadata: { network: extPub.network } };
    }

    if (trimmed.startsWith('lnbc') || trimmed.startsWith('lntb')) {
      return { type: 'lightning_invoice', raw: trimmed };
    }

    if (isPsbtPayload(trimmed)) {
      return { type: 'psbt', raw: trimmed };
    }

    const bech = validateBech32(trimmed);
    if (bech.ok || validateBase58Address(trimmed)) {
      return {
        type: 'bitcoin_address',
        raw: trimmed,
        metadata: { network: bech.network ?? (trimmed.startsWith('m') || trimmed.startsWith('n') ? 'testnet' : 'mainnet') }
      };
    }

    return { type: 'unknown', raw: trimmed };
  }

  encodePayload(input: string): string {
    return input;
  }
}
