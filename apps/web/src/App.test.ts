import { describe, expect, it } from 'vitest';
import { UniversalQrService } from '@bursh/qr-engine';

describe('app flow', () => {
  const parser = new UniversalQrService();

  it('detecta payload xpub válido', () => {
    const validXpub =
      'xpub661MyMwAqRbcF7M2X6drfR6MghvYDn8ApX2HFqRSbVSSMzdg3NofM8JrjYNewc19hXtF87mpy4VbQJu1WDVYj1WFJsbgx5caGV5hHnhbAUr';

    expect(parser.detectPayload(validXpub).type).toBe('xpub');
  });

  it('não classifica xpub inválido como válido', () => {
    const invalidXpub =
      'xpub661MyMwAqRbcF7M2X6drfR6MghvYDn8ApX2HFqRSbVSSMzdg3NofM8JrjYNewc19hXtF87mpy4VbQJu1WDVYj1WFJsbgx5caGV5hHnhbAUx';

    expect(parser.detectPayload(invalidXpub).type).toBe('unknown');
  });
});
