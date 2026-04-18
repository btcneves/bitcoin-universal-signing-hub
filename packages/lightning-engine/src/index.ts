import { decode } from 'bolt11';
import type { LightningService } from '@bursh/core-domain';
import type { LightningInvoice } from '@bursh/shared-types';

const msatToSat = (millisatoshis?: string): number | undefined => {
  if (!millisatoshis) return undefined;
  const msat = Number(millisatoshis);
  if (!Number.isFinite(msat)) return undefined;
  return Math.floor(msat / 1000);
};

export class Bolt11ParserService implements LightningService {
  parseBolt11(invoice: string): LightningInvoice {
    const normalized = invoice.trim().toLowerCase();
    const decoded = decode(normalized);

    if (!decoded.complete) {
      throw new Error('BOLT11 inválido: assinatura ou integridade inválida');
    }

    const descriptionTag = decoded.tags.find((tag) => tag.tagName === 'description');
    const expiryTag = decoded.tags.find((tag) => tag.tagName === 'expire_time');

    return {
      raw: invoice,
      amountSats: msatToSat(decoded.millisatoshis),
      description: typeof descriptionTag?.data === 'string' ? descriptionTag.data : undefined,
      expiry: typeof expiryTag?.data === 'number' ? expiryTag.data : 3600
    };
  }
}
