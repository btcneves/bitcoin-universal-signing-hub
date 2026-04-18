import { describe, expect, it } from 'vitest';
import { BlockstreamBroadcastAdapter } from '../src/index';

describe('network adapter', () => {
  it('creates adapter with endpoint', () => {
    const adapter = new BlockstreamBroadcastAdapter('https://example.com');
    expect(adapter).toBeDefined();
  });
});
