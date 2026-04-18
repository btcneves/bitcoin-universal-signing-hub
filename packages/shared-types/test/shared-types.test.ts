import { describe, expect, it } from 'vitest';
import type { SecurityZone } from '../src/index';

describe('shared types', () => {
  it('accepts known security zones', () => {
    const zone: SecurityZone = 'ZONE_0_SENSITIVE_RAM';
    expect(zone).toBe('ZONE_0_SENSITIVE_RAM');
  });
});
