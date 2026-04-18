import type { BroadcastService } from '@bursh/core-domain';

export class BlockstreamBroadcastAdapter implements BroadcastService {
  constructor(private readonly endpoint = 'https://blockstream.info/api/tx') {}

  async broadcastTransaction(rawHex: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: rawHex,
      headers: { 'content-type': 'text/plain' }
    });

    if (!response.ok) {
      throw new Error(`Broadcast failed with status ${response.status}`);
    }

    return response.text();
  }
}
