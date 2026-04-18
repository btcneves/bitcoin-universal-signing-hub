import type { LightningService } from '@bursh/core-domain';
import type { LightningInvoice } from '@bursh/shared-types';

export class Bolt11ParserService implements LightningService {
  parseBolt11(invoice: string): LightningInvoice {
    if (!invoice.startsWith('lnbc')) {
      throw new Error('Invalid BOLT11 invoice');
    }

    const amountHint = invoice.match(/^lnbc(\d+)([munp]?)/i);
    const amount = amountHint ? Number(amountHint[1]) : undefined;

    return {
      raw: invoice,
      amountSats: amount,
      description: 'Parsed minimally for offline validation',
      expiry: 3600
    };
  }
}
