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

const SENSITIVE_PATTERNS = [/seed/gi, /mnemonic/gi, /private\s*key/gi, /passphrase/gi];

export const redactSensitiveText = (message: string): string => {
  let out = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    out = out.replace(pattern, '[REDACTED]');
  }
  return out;
};

export const assertNoSensitiveLogging = (message: string): void => {
  if (redactSensitiveText(message) !== message) {
    throw new Error('Sensitive data token blocked from logs');
  }
};

export interface SecureLogger {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}

export const createSecureLogger = (
  sink: (level: 'info' | 'warn' | 'error', line: string) => void
): SecureLogger => {
  const emit = (level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) => {
    const safeMessage = redactSensitiveText(message);
    const safeMeta = metadata ? redactSensitiveText(JSON.stringify(metadata)) : undefined;
    sink(level, safeMeta ? `${safeMessage} ${safeMeta}` : safeMessage);
  };

  return {
    info(message, metadata) {
      emit('info', message, metadata);
    },
    warn(message, metadata) {
      emit('warn', message, metadata);
    },
    error(message, metadata) {
      emit('error', message, metadata);
    }
  };
};
