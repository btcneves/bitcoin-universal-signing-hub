import type { ExternalSignerAdapter, PsbtService } from '@bursh/core-domain';

const PSBT_PREFIX = 'cHNidP';

export class DefaultPsbtService implements PsbtService {
  createPsbt(inputs: string[], outputs: Array<{ address: string; amountSats: number }>): string {
    const payload = JSON.stringify({ inputs, outputs, version: 0 });
    return Buffer.from(payload).toString('base64');
  }

  validatePsbt(psbtBase64: string): boolean {
    return psbtBase64.startsWith(PSBT_PREFIX) || this.tryDecode(psbtBase64);
  }

  finalizePsbt(psbtBase64: string): string {
    if (!this.validatePsbt(psbtBase64)) {
      throw new Error('Invalid PSBT payload');
    }
    return `finalized:${psbtBase64.slice(0, 24)}`;
  }

  private tryDecode(input: string): boolean {
    try {
      JSON.parse(Buffer.from(input, 'base64').toString('utf8'));
      return true;
    } catch {
      return false;
    }
  }
}

export class QrExternalSignerAdapter implements ExternalSignerAdapter {
  exportPsbtToQr(psbtBase64: string): string {
    return `ur:crypto-psbt/${psbtBase64}`;
  }

  importSignedPsbtFromQr(qrPayload: string): string {
    if (!qrPayload.startsWith('ur:crypto-psbt/')) {
      throw new Error('Unsupported external signer QR payload');
    }
    return qrPayload.replace('ur:crypto-psbt/', '');
  }
}
