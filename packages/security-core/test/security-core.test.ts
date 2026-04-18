import { describe, expect, it } from 'vitest';
import { SensitiveMemory, assertNoSensitiveLogging } from '../src/index';

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
});
