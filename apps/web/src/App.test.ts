import { describe, expect, it } from 'vitest';
import { UniversalQrService } from '@bursh/qr-engine';

describe('app flow', () => {
  it('auto detects qr type', () => {
    const parser = new UniversalQrService();
    expect(parser.detectPayload('xpub6CUGRUon...').type).toBe('xpub');
  });
});
