import { describe, expect, it } from 'vitest';
import { Bolt11ParserService } from '../src/index';

describe('lightning parser', () => {
  it('parses lnbc invoice', () => {
    const parser = new Bolt11ParserService();
    const parsed = parser.parseBolt11('lnbc10u1testinvoice');
    expect(parsed.amountSats).toBe(10);
  });
});
