export class SensitiveMemory {
  private active = true;

  constructor(private readonly data: Uint8Array) {}

  read(): Uint8Array {
    if (!this.active) {
      throw new Error('Sensitive memory already wiped');
    }
    return this.data;
  }

  wipe(): void {
    this.data.fill(0);
    this.active = false;
  }
}

export const assertNoSensitiveLogging = (message: string): void => {
  const banned = ['seed', 'mnemonic', 'private key', 'passphrase'];
  const normalized = message.toLowerCase();
  for (const token of banned) {
    if (normalized.includes(token)) {
      throw new Error('Sensitive data token blocked from logs');
    }
  }
};
