import { describe, expect, it } from 'vitest';
import { encode, sign } from 'bolt11';
import { Bolt11ParserService } from '../src/index';

const makeInvoice = (): string => {
  const encoded = encode({
    satoshis: 1000,
    timestamp: 1700000000,
    tags: [
      { tagName: 'payment_hash', data: '0'.repeat(64) },
      { tagName: 'description', data: 'unit-test-invoice' },
      { tagName: 'expire_time', data: 1800 }
    ]
  });

  return sign(encoded, '1'.repeat(64));
};

describe('lightning parser', () => {
  it('valida assinatura e extrai amount/expiry/description', () => {
    const parser = new Bolt11ParserService();
    const invoice = makeInvoice();
    const parsed = parser.parseBolt11(invoice);
    expect(parsed.amountSats).toBe(1000);
    expect(parsed.expiry).toBe(1800);
    expect(parsed.description).toBe('unit-test-invoice');
  });

  it('rejeita invoice alterada', () => {
    const parser = new Bolt11ParserService();
    const invoice = makeInvoice();
    const tampered = `${invoice.slice(0, -1)}${invoice.endsWith('q') ? 'p' : 'q'}`;
    expect(() => parser.parseBolt11(tampered)).toThrow();
  });
});
