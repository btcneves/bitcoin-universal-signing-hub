import type { LightningInvoice, ParsedQRPayload, WalletDescriptor } from '@bursh/shared-types';

export interface MnemonicService {
  validateMnemonic(mnemonic: string): boolean;
  generateSeed(mnemonic: string, passphrase?: string): Uint8Array;
  secureWipe(seed: Uint8Array): void;
}

export interface WalletService {
  deriveBip84Wallet(seed: Uint8Array, account?: number): WalletDescriptor;
  deriveAddress(xpub: string, change: 0 | 1, index: number): string;
}

export interface PsbtService {
  createPsbt(inputs: string[], outputs: Array<{ address: string; amountSats: number }>): string;
  validatePsbt(psbtBase64: string): boolean;
  finalizePsbt(psbtBase64: string): string;
}

export interface QRService {
  detectPayload(input: string): ParsedQRPayload;
  encodePayload(input: string): string;
}

export interface LightningService {
  parseBolt11(invoice: string): LightningInvoice;
}

export interface BroadcastService {
  broadcastTransaction(rawHex: string): Promise<string>;
}

export interface ExternalSignerAdapter {
  exportPsbtToQr(psbtBase64: string): string;
  importSignedPsbtFromQr(qrPayload: string): string;
}
