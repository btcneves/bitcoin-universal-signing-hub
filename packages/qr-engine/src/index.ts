import { sha256 } from '@noble/hashes/sha2';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import type { QRService } from '@bursh/core-domain';
import type { ParsedQRPayload } from '@bursh/shared-types';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map([...BASE58_ALPHABET].map((c, i) => [c, i]));
const PSBT_MAGIC_BYTES = new Uint8Array([0x70, 0x73, 0x62, 0x74, 0xff]);
const BECH32_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3 >>> 0;
const BECH32_MAP = new Map([...BECH32_CHARS].map((c, i) => [c, i]));
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_MAP = new Map([...BASE64_ALPHABET].map((c, i) => [c, i]));

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

const isAsciiWhitespace = (charCode: number): boolean =>
  charCode === 0x20 || (charCode >= 0x09 && charCode <= 0x0d);

const normalizeBase64Input = (value: string): string | undefined => {
  let body = '';
  let sawPadding = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (!char) return undefined;
    const charCode = char.charCodeAt(0);
    if (isAsciiWhitespace(charCode)) continue;

    if (char === '=') {
      sawPadding = true;
      continue;
    }

    if (sawPadding) return undefined;
    if (char === '-') {
      body += '+';
      continue;
    }
    if (char === '_') {
      body += '/';
      continue;
    }
    body += char;
  }

  if (!body) return undefined;
  return body;
};

const decodeBase64 = (value: string): Uint8Array | undefined => {
  const normalized = normalizeBase64Input(value);
  if (!normalized) return undefined;

  const missingPadding = normalized.length % 4;
  if (missingPadding === 1) return undefined;
  const padded =
    missingPadding === 0 ? normalized : `${normalized}${'='.repeat(4 - missingPadding)}`;

  const out: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const c0 = padded[i];
    const c1 = padded[i + 1];
    const c2 = padded[i + 2];
    const c3 = padded[i + 3];
    if (!c0 || !c1 || !c2 || !c3) return undefined;

    const v0 = BASE64_MAP.get(c0);
    const v1 = BASE64_MAP.get(c1);
    const v2 = c2 === '=' ? 0 : BASE64_MAP.get(c2);
    const v3 = c3 === '=' ? 0 : BASE64_MAP.get(c3);
    if (v0 === undefined || v1 === undefined || v2 === undefined || v3 === undefined) {
      return undefined;
    }
    if (c2 === '=' && c3 !== '=') return undefined;
    if ((c2 === '=' || c3 === '=') && i + 4 !== padded.length) return undefined;

    const combined = (v0 << 18) | (v1 << 12) | (v2 << 6) | v3;
    out.push((combined >> 16) & 0xff);
    if (c2 !== '=') out.push((combined >> 8) & 0xff);
    if (c3 !== '=') out.push(combined & 0xff);
  }

  return new Uint8Array(out);
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
  const dataPart = lower.slice(separator + 1);
  if (prefix !== 'bc' && prefix !== 'tb') return { ok: false };

  const data = [...dataPart].map((c) => BECH32_MAP.get(c));
  if (data.some((v) => v === undefined)) return { ok: false };
  const words = data as number[];

  const expandHrp = (hrp: string): number[] => {
    const high = [...hrp].map((c) => c.charCodeAt(0) >> 5);
    const low = [...hrp].map((c) => c.charCodeAt(0) & 31);
    return [...high, 0, ...low];
  };

  const polymod = (values: number[]): number => {
    const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1 >>> 0;
    for (const valueWord of values) {
      const top = chk >> 25;
      chk = ((((chk & 0x1ffffff) << 5) ^ valueWord) & 0xffffffff) >>> 0;
      for (let i = 0; i < generators.length; i += 1) {
        const generator = generators[i];
        if (generator !== undefined && (top >> i) & 1) chk = (chk ^ generator) >>> 0;
      }
    }
    return chk >>> 0;
  };

  const checksum = polymod([...expandHrp(prefix), ...words]);
  const isBech32 = checksum === BECH32_CONST;
  const isBech32m = checksum === BECH32M_CONST;
  if (!isBech32 && !isBech32m) return { ok: false };

  const witnessVersion = words[0];
  if (witnessVersion === undefined) return { ok: false };
  if (witnessVersion < 0 || witnessVersion > 16) return { ok: false };

  const dataWords = words.slice(1, -6);
  if (dataWords.length === 0) return { ok: false };

  const convertBits = (inputWords: number[], from: number, to: number): number[] | undefined => {
    let acc = 0;
    let bits = 0;
    const maxValue = (1 << to) - 1;
    const out: number[] = [];
    for (const word of inputWords) {
      if (word < 0 || word >= 1 << from) return undefined;
      acc = (acc << from) | word;
      bits += from;
      while (bits >= to) {
        bits -= to;
        out.push((acc >> bits) & maxValue);
      }
    }
    if (bits > 0 && (acc << (to - bits)) & maxValue) return undefined;
    return out;
  };

  const witnessProgram = convertBits(dataWords, 5, 8);
  if (!witnessProgram) return { ok: false };
  if (witnessProgram.length < 2 || witnessProgram.length > 40) return { ok: false };
  if (witnessVersion === 0 && witnessProgram.length !== 20 && witnessProgram.length !== 32) {
    return { ok: false };
  }
  if (witnessVersion === 0 && !isBech32) return { ok: false };
  if (witnessVersion !== 0 && !isBech32m) return { ok: false };

  return { ok: true, network: prefix === 'bc' ? 'mainnet' : 'testnet' };
};

const validatePsbtPayload = (input: string): boolean => {
  const trimmed = input.trim();
  const candidate = trimmed.startsWith('ur:crypto-psbt/')
    ? trimmed.slice('ur:crypto-psbt/'.length)
    : trimmed;

  const readCompactSize = (
    bytes: Uint8Array,
    offset: number
  ): { value: number; next: number } | undefined => {
    const first = bytes[offset];
    if (first === undefined) return undefined;
    if (first < 0xfd) return { value: first, next: offset + 1 };

    if (first === 0xfd) {
      const b0 = bytes[offset + 1];
      const b1 = bytes[offset + 2];
      if (b0 === undefined || b1 === undefined) return undefined;
      return { value: b0 | (b1 << 8), next: offset + 3 };
    }

    if (first === 0xfe) {
      const b0 = bytes[offset + 1];
      const b1 = bytes[offset + 2];
      const b2 = bytes[offset + 3];
      const b3 = bytes[offset + 4];
      if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) {
        return undefined;
      }
      return { value: (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0, next: offset + 5 };
    }

    const lo0 = bytes[offset + 1];
    const lo1 = bytes[offset + 2];
    const lo2 = bytes[offset + 3];
    const lo3 = bytes[offset + 4];
    const hi0 = bytes[offset + 5];
    const hi1 = bytes[offset + 6];
    const hi2 = bytes[offset + 7];
    const hi3 = bytes[offset + 8];
    if (
      lo0 === undefined ||
      lo1 === undefined ||
      lo2 === undefined ||
      lo3 === undefined ||
      hi0 === undefined ||
      hi1 === undefined ||
      hi2 === undefined ||
      hi3 === undefined
    ) {
      return undefined;
    }

    const low = BigInt((lo0 | (lo1 << 8) | (lo2 << 16) | (lo3 << 24)) >>> 0);
    const high = BigInt((hi0 | (hi1 << 8) | (hi2 << 16) | (hi3 << 24)) >>> 0);
    const combined = low | (high << 32n);
    if (combined > BigInt(Number.MAX_SAFE_INTEGER)) return undefined;
    return { value: Number(combined), next: offset + 9 };
  };

  const parseMap = (
    bytes: Uint8Array,
    offset: number
  ): { next: number; entries: Map<number, Uint8Array[]> } | undefined => {
    const entries = new Map<number, Uint8Array[]>();
    let cursor = offset;

    while (cursor < bytes.length) {
      const keyLen = readCompactSize(bytes, cursor);
      if (!keyLen) return undefined;
      cursor = keyLen.next;

      if (keyLen.value === 0) return { next: cursor, entries };

      if (cursor + keyLen.value > bytes.length) return undefined;
      const key = bytes.subarray(cursor, cursor + keyLen.value);
      cursor += keyLen.value;

      const valueLen = readCompactSize(bytes, cursor);
      if (!valueLen) return undefined;
      cursor = valueLen.next;

      if (cursor + valueLen.value > bytes.length) return undefined;
      const value = bytes.subarray(cursor, cursor + valueLen.value);
      cursor += valueLen.value;

      const keyType = key[0];
      if (keyType === undefined) return undefined;
      const existing = entries.get(keyType);
      if (existing) existing.push(value);
      else entries.set(keyType, [value]);
    }

    return undefined;
  };

  const parseLegacyTxInputOutputCounts = (
    txBytes: Uint8Array
  ): { inputCount: number; outputCount: number } | undefined => {
    let cursor = 0;
    if (txBytes.length < 10) return undefined;
    cursor += 4; // version

    const marker = txBytes[cursor];
    const flag = txBytes[cursor + 1];
    const hasWitness = marker === 0 && flag === 1;
    if (hasWitness) cursor += 2;

    const vinCount = readCompactSize(txBytes, cursor);
    if (!vinCount) return undefined;
    cursor = vinCount.next;
    const inputCount = vinCount.value;

    for (let i = 0; i < inputCount; i += 1) {
      if (cursor + 36 > txBytes.length) return undefined;
      cursor += 36;
      const scriptLen = readCompactSize(txBytes, cursor);
      if (!scriptLen) return undefined;
      cursor = scriptLen.next;
      if (cursor + scriptLen.value + 4 > txBytes.length) return undefined;
      cursor += scriptLen.value + 4;
    }

    const voutCount = readCompactSize(txBytes, cursor);
    if (!voutCount) return undefined;
    cursor = voutCount.next;
    const outputCount = voutCount.value;

    for (let i = 0; i < outputCount; i += 1) {
      if (cursor + 8 > txBytes.length) return undefined;
      cursor += 8;
      const scriptLen = readCompactSize(txBytes, cursor);
      if (!scriptLen) return undefined;
      cursor = scriptLen.next;
      if (cursor + scriptLen.value > txBytes.length) return undefined;
      cursor += scriptLen.value;
    }

    if (hasWitness) {
      for (let i = 0; i < inputCount; i += 1) {
        const witnessItems = readCompactSize(txBytes, cursor);
        if (!witnessItems) return undefined;
        cursor = witnessItems.next;
        for (let j = 0; j < witnessItems.value; j += 1) {
          const itemLen = readCompactSize(txBytes, cursor);
          if (!itemLen) return undefined;
          cursor = itemLen.next;
          if (cursor + itemLen.value > txBytes.length) return undefined;
          cursor += itemLen.value;
        }
      }
    }

    if (cursor + 4 !== txBytes.length) return undefined;
    return { inputCount, outputCount };
  };

  const parseLegacyTxCountsPrefix = (
    txBytes: Uint8Array
  ): { inputCount: number; outputCount: number } | undefined => {
    let cursor = 0;
    if (txBytes.length < 10) return undefined;
    cursor += 4; // version

    const marker = txBytes[cursor];
    const flag = txBytes[cursor + 1];
    const hasWitness = marker === 0 && flag === 1;
    if (hasWitness) cursor += 2;

    const vinCount = readCompactSize(txBytes, cursor);
    if (!vinCount) return undefined;
    cursor = vinCount.next;
    const inputCount = vinCount.value;

    for (let i = 0; i < inputCount; i += 1) {
      if (cursor + 36 > txBytes.length) return undefined;
      cursor += 36;
      const scriptLen = readCompactSize(txBytes, cursor);
      if (!scriptLen) return undefined;
      cursor = scriptLen.next;
      if (cursor + scriptLen.value + 4 > txBytes.length) return undefined;
      cursor += scriptLen.value + 4;
    }

    const voutCount = readCompactSize(txBytes, cursor);
    if (!voutCount) return undefined;
    return { inputCount, outputCount: voutCount.value };
  };

  const parseCompactSizeFromBytes = (value: Uint8Array): number | undefined => {
    const result = readCompactSize(value, 0);
    if (!result || result.next !== value.length) return undefined;
    return result.value;
  };

  const parseMapWithoutTerminator = (
    bytes: Uint8Array,
    offset: number
  ): { next: number; entries: Map<number, Uint8Array[]> } | undefined => {
    const entries = new Map<number, Uint8Array[]>();
    let cursor = offset;

    while (cursor < bytes.length) {
      const keyLen = readCompactSize(bytes, cursor);
      if (!keyLen) return undefined;
      cursor = keyLen.next;

      if (keyLen.value === 0) return undefined;
      if (cursor + keyLen.value > bytes.length) return undefined;
      const key = bytes.subarray(cursor, cursor + keyLen.value);
      cursor += keyLen.value;

      const valueLen = readCompactSize(bytes, cursor);
      if (!valueLen) return undefined;
      cursor = valueLen.next;

      if (cursor + valueLen.value > bytes.length) return undefined;
      const value = bytes.subarray(cursor, cursor + valueLen.value);
      cursor += valueLen.value;

      const keyType = key[0];
      if (keyType === undefined) return undefined;
      const existing = entries.get(keyType);
      if (existing) existing.push(value);
      else entries.set(keyType, [value]);
    }

    return { next: cursor, entries };
  };

  const isValidPsbtBytes = (bytes: Uint8Array): boolean => {
    if (!startsWithBytes(bytes, PSBT_MAGIC_BYTES)) return false;
    let cursor = PSBT_MAGIC_BYTES.length;

    const globalMap = parseMap(bytes, cursor);
    if (!globalMap) {
      const compatibilityGlobalMap = parseMapWithoutTerminator(bytes, cursor);
      if (!compatibilityGlobalMap) return false;

      const unsignedTxValues = compatibilityGlobalMap.entries.get(0x00);
      if (!unsignedTxValues || unsignedTxValues.length !== 1) return false;
      if (compatibilityGlobalMap.entries.size !== 1) return false;

      const [unsignedTxValue] = unsignedTxValues;
      if (!unsignedTxValue) return false;
      const prefixCounts = parseLegacyTxCountsPrefix(unsignedTxValue);
      return prefixCounts !== undefined;
    }
    cursor = globalMap.next;

    const unsignedTxValues = globalMap.entries.get(0x00);
    const inputCountValues = globalMap.entries.get(0x04);
    const outputCountValues = globalMap.entries.get(0x05);

    let inputCount: number | undefined;
    let outputCount: number | undefined;

    if (unsignedTxValues && unsignedTxValues.length === 1) {
      const [unsignedTxValue] = unsignedTxValues;
      if (!unsignedTxValue) return false;
      const parsedCounts = parseLegacyTxInputOutputCounts(unsignedTxValue);
      if (!parsedCounts) return false;
      inputCount = parsedCounts.inputCount;
      outputCount = parsedCounts.outputCount;
    } else {
      if (!inputCountValues || inputCountValues.length !== 1) return false;
      if (!outputCountValues || outputCountValues.length !== 1) return false;
      const [inputCountValue] = inputCountValues;
      const [outputCountValue] = outputCountValues;
      if (!inputCountValue || !outputCountValue) return false;
      inputCount = parseCompactSizeFromBytes(inputCountValue);
      outputCount = parseCompactSizeFromBytes(outputCountValue);
      if (inputCount === undefined || outputCount === undefined) return false;
    }

    for (let i = 0; i < inputCount; i += 1) {
      const inputMap = parseMap(bytes, cursor);
      if (!inputMap) return false;
      cursor = inputMap.next;
    }

    for (let i = 0; i < outputCount; i += 1) {
      const outputMap = parseMap(bytes, cursor);
      if (!outputMap) return false;
      cursor = outputMap.next;
    }

    return cursor === bytes.length;
  };

  let rawBytes: Uint8Array | undefined;
  if (/^[0-9a-fA-F]+$/.test(candidate) && candidate.length % 2 === 0) {
    rawBytes = hexToBytes(candidate);
  } else {
    rawBytes = decodeBase64(candidate);
  }

  if (!rawBytes) return false;
  return isValidPsbtBytes(rawBytes);
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
