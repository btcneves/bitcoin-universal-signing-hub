import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Bip84WalletService } from '@bursh/bitcoin-engine';
import { UniversalQrService } from '../src/index';

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const map = new Map([...alphabet].map((c, i) => [c, i]));

const b58decode = (value: string): Buffer => {
  let num = 0n;
  for (const c of value) num = num * 58n + BigInt(map.get(c) ?? 0);
  let hex = num.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  let out = Buffer.from(hex, 'hex');
  for (const c of value) {
    if (c === '1') out = Buffer.concat([Buffer.from([0]), out]);
    else break;
  }
  return out;
};

const b58encode = (value: Buffer): string => {
  let num = BigInt(`0x${value.toString('hex')}`);
  let out = '';
  while (num > 0n) {
    out = alphabet[Number(num % 58n)] + out;
    num /= 58n;
  }
  for (const byte of value) {
    if (byte === 0) out = `1${out}`;
    else break;
  }
  return out;
};

const recodeVersion = (xpub: string, version: number): string => {
  const raw = b58decode(xpub);
  const payload = Buffer.from(raw.subarray(0, -4));
  payload.writeUInt32BE(version, 0);
  const checksum = createHash('sha256').update(createHash('sha256').update(payload).digest()).digest().subarray(0, 4);
  return b58encode(Buffer.concat([payload, checksum]));
};

describe('QR parser', () => {
  const parser = new UniversalQrService();

  it('detecta xpub/ypub/zpub', () => {
    const wallet = new Bip84WalletService();
    const descriptor = wallet.deriveBip84Wallet(new Uint8Array(64).fill(1));
    const ypub = recodeVersion(descriptor.accountXpub, 0x049d7cb2);

    expect(parser.detectPayload(descriptor.accountXpub).type).toBe('xpub');
    expect(parser.detectPayload(ypub).type).toBe('ypub');
    expect(parser.detectPayload(descriptor.accountZpub).type).toBe('zpub');
  });

  it('detecta endereço bitcoin e rede', () => {
    const result = parser.detectPayload('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty');
    expect(result.type).toBe('bitcoin_address');
    expect(result.metadata?.network).toBe('mainnet');
  });

  it('detecta psbt base64', () => {
    const psbt = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff, 0x00]).toString('base64');
    expect(parser.detectPayload(psbt).type).toBe('psbt');
  });
});
