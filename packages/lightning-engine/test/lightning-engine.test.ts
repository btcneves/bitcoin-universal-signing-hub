import { describe, expect, it } from 'vitest';
import { Bolt11ParserService } from '../src/index';

describe('lightning parser', () => {
  it('faz parsing básico de BOLT11 e extrai amount/expiry', () => {
    const parser = new Bolt11ParserService();
    const invoice = `lnbc10u1${'q'.repeat(140)}`;
    const parsed = parser.parseBolt11(invoice);
    expect(parsed.amountSats).toBe(1000);
    expect(parsed.expiry).toBe(3600);
  });
});
