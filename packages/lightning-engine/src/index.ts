import type { LightningService } from '@bursh/core-domain';
import type { LightningInvoice } from '@bursh/shared-types';

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const decodeAmount = (hrp: string): number | undefined => {
  const amountPart = hrp.slice(4);
  if (!amountPart) return undefined;
  const unit = amountPart.at(-1);
  const value = Number(unit && /[munp]/.test(unit) ? amountPart.slice(0, -1) : amountPart);
  if (!Number.isFinite(value)) return undefined;
  switch (unit) {
    case 'm':
      return (value * 100_000_000) / 1000;
    case 'u':
      return (value * 100_000_000) / 1_000_000;
    case 'n':
      return (value * 100_000_000) / 1_000_000_000;
    case 'p':
      return (value * 100_000_000) / 1_000_000_000_000;
    default:
      return value * 100_000_000;
  }
};

const bech32Decode = (input: string): { hrp: string; words: number[] } => {
  const lower = input.toLowerCase();
  const sep = lower.lastIndexOf('1');
  if (sep < 1) throw new Error('BOLT11 inválido: separador bech32 ausente');

  const hrp = lower.slice(0, sep);
  const data = lower.slice(sep + 1);
  const words = [...data].map((c) => CHARSET.indexOf(c));
  if (words.some((v) => v < 0)) throw new Error('BOLT11 inválido: charset inválido');
  return { hrp, words };
};

const readTagData = (words: number[], start: number): { tag: number; len: number; next: number; value: number[] } => {
  const tag = words[start];
  const len = (words[start + 1] << 5) + words[start + 2];
  const valueStart = start + 3;
  const valueEnd = valueStart + len;
  return { tag, len, next: valueEnd, value: words.slice(valueStart, valueEnd) };
};

const wordsToHex = (words: number[]): string => {
  let acc = 0;
  let bits = 0;
  const bytes: number[] = [];
  for (const w of words) {
    acc = (acc << 5) | w;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((acc >> bits) & 0xff);
    }
  }
  return Buffer.from(bytes).toString('hex');
};

export class Bolt11ParserService implements LightningService {
  parseBolt11(invoice: string): LightningInvoice {
    const { hrp, words } = bech32Decode(invoice);
    if (!hrp.startsWith('lnbc')) {
      throw new Error('Invalid BOLT11 invoice');
    }

    const body = words.slice(0, -104);
    let cursor = 7;
    let expiry = 3600;
    let destination: string | undefined;

    while (cursor < body.length - 3) {
      const { tag, next, value } = readTagData(body, cursor);
      if (tag === 6) {
        expiry = parseInt(wordsToHex(value) || '0', 16) || expiry;
      }
      if (tag === 19) {
        destination = wordsToHex(value);
      }
      cursor = next;
    }

    return {
      raw: invoice,
      amountSats: decodeAmount(hrp),
      description: destination ? `destination:${destination}` : 'destination:unknown',
      expiry
    };
  }
}
