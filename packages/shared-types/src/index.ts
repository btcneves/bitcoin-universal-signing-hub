export type SecurityZone = 'ZONE_0_SENSITIVE_RAM' | 'ZONE_1_PRIVATE' | 'ZONE_2_NETWORK';

export type QRPayloadType =
  | 'bip39'
  | 'xpub'
  | 'ypub'
  | 'zpub'
  | 'psbt'
  | 'bitcoin_address'
  | 'lightning_invoice'
  | 'unknown';

export interface SensitiveSession {
  readonly zone: 'ZONE_0_SENSITIVE_RAM';
  readonly createdAt: number;
  wipe(): void;
}

export interface WalletDescriptor {
  readonly accountXpub: string;
  readonly accountZpub: string;
  readonly derivationPath: string;
}

export interface LightningInvoice {
  readonly raw: string;
  readonly amountSats?: number;
  readonly description?: string;
  readonly expiry?: number;
}

export interface ParsedQRPayload {
  readonly type: QRPayloadType;
  readonly raw: string;
  readonly metadata?: Record<string, string | number | boolean>;
}
