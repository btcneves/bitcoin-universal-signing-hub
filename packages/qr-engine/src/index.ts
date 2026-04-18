import type { QRService } from '@bursh/core-domain';
import type { ParsedQRPayload } from '@bursh/shared-types';

const XPUB_REGEX = /^(xpub|ypub|zpub)[1-9A-HJ-NP-Za-km-z]+$/;
const BTC_ADDRESS_REGEX = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/i;

export class UniversalQrService implements QRService {
  detectPayload(input: string): ParsedQRPayload {
    const trimmed = input.trim();
    const words = trimmed.split(/\s+/);
    if ([12, 15, 18, 21, 24].includes(words.length)) {
      return { type: 'bip39', raw: trimmed };
    }
    if (XPUB_REGEX.test(trimmed)) {
      return { type: trimmed.slice(0, 4) as 'xpub' | 'ypub' | 'zpub', raw: trimmed };
    }
    if (trimmed.startsWith('lnbc')) {
      return { type: 'lightning_invoice', raw: trimmed };
    }
    if (trimmed.startsWith('cHNidP') || trimmed.startsWith('ur:crypto-psbt/')) {
      return { type: 'psbt', raw: trimmed };
    }
    if (BTC_ADDRESS_REGEX.test(trimmed)) {
      return { type: 'bitcoin_address', raw: trimmed };
    }
    return { type: 'unknown', raw: trimmed };
  }

  encodePayload(input: string): string {
    return input;
  }
}
