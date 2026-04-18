import { describe, expect, it } from 'vitest';
import { SensitiveMemory, assertNoSensitiveLogging, createSecureLogger } from '../src/index';

describe('security-core', () => {
  it('wipes sensitive buffers', () => {
    const data = new Uint8Array([1, 2, 3]);
    const mem = new SensitiveMemory(data);
    mem.wipe();
    expect([...data]).toEqual([0, 0, 0]);
  });

  it('blocks sensitive log tokens', () => {
    expect(() => assertNoSensitiveLogging('seed example')).toThrowError();
  });

  it('redacta logs sensíveis', () => {
    const lines: string[] = [];
    const logger = createSecureLogger((level, line) => lines.push(`${level}:${line}`));
    logger.warn('mnemonic carregado', { passphrase: 'abc' });
    expect(lines[0]).not.toContain('mnemonic');
    expect(lines[0]).not.toContain('passphrase');
    expect(lines[0]).toContain('[REDACTED]');
  });
});
