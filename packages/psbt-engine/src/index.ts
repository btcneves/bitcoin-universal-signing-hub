import type { ExternalSignerAdapter, PsbtService } from '@bursh/core-domain';

const PSBT_MAGIC = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]);

const readCompactSize = (buffer: Buffer, offset: number): { value: number; bytes: number } => {
  const first = buffer[offset];
  if (first < 0xfd) return { value: first, bytes: 1 };
  if (first === 0xfd) return { value: buffer.readUInt16LE(offset + 1), bytes: 3 };
  if (first === 0xfe) return { value: buffer.readUInt32LE(offset + 1), bytes: 5 };
  throw new Error('CompactSize > 32-bit não suportado na estrutura inicial');
};

const parseMap = (buffer: Buffer, start: number): { next: number; entries: number } => {
  let offset = start;
  let entries = 0;

  while (offset < buffer.length) {
    const keyLen = readCompactSize(buffer, offset);
    offset += keyLen.bytes;
    if (keyLen.value === 0) {
      return { next: offset, entries };
    }

    const keyStart = offset;
    offset += keyLen.value;
    const valueLen = readCompactSize(buffer, offset);
    offset += valueLen.bytes + valueLen.value;

    if (offset > buffer.length) {
      throw new Error('PSBT malformado: field além do payload');
    }

    const keyType = buffer[keyStart];
    if (keyType === 0x00 && entries > 0) {
      throw new Error('PSBT inválido: unsigned tx duplicada no global map');
    }
    entries += 1;
  }

  throw new Error('PSBT malformado: mapa sem terminador');
};

const decodePsbtBuffer = (input: string): Buffer => {
  const trimmed = input.trim();
  if (trimmed.startsWith('70736274ff')) {
    return Buffer.from(trimmed, 'hex');
  }
  const raw = Buffer.from(trimmed, 'base64');
  if (raw.length === 0 || Buffer.from(raw.toString('base64')).toString('base64') !== raw.toString('base64')) {
    throw new Error('PSBT inválido: base64 malformado');
  }
  return raw;
};

export class DefaultPsbtService implements PsbtService {
  createPsbt(inputs: string[], outputs: Array<{ address: string; amountSats: number }>): string {
    const payload = JSON.stringify({ inputs, outputs, version: 0 });
    return Buffer.concat([PSBT_MAGIC, Buffer.from(payload)]).toString('base64');
  }

  validatePsbt(psbtBase64: string): boolean {
    try {
      const parsed = this.parseStructural(psbtBase64);
      return parsed.inputMaps >= 0 && parsed.outputMaps >= 0;
    } catch {
      return false;
    }
  }

  finalizePsbt(psbtBase64: string): string {
    const parsed = this.parseStructural(psbtBase64);
    return `finalized:inputs=${parsed.inputMaps};outputs=${parsed.outputMaps}`;
  }

  parseStructural(psbtPayload: string): { inputMaps: number; outputMaps: number; globalEntries: number } {
    const raw = decodePsbtBuffer(psbtPayload);
    if (!raw.subarray(0, 5).equals(PSBT_MAGIC)) {
      throw new Error('PSBT inválido: prefixo mágico ausente');
    }

    let offset = 5;
    const global = parseMap(raw, offset);
    offset = global.next;

    const inputMaps = Math.min(raw.length - offset, 1);
    let parsedInputMaps = 0;
    for (let i = 0; i < inputMaps; i++) {
      const next = parseMap(raw, offset);
      offset = next.next;
      parsedInputMaps += 1;
    }

    let parsedOutputMaps = 0;
    while (offset < raw.length) {
      const next = parseMap(raw, offset);
      offset = next.next;
      parsedOutputMaps += 1;
    }

    return { inputMaps: parsedInputMaps, outputMaps: parsedOutputMaps, globalEntries: global.entries };
  }
}

export class QrExternalSignerAdapter implements ExternalSignerAdapter {
  exportPsbtToQr(psbtBase64: string): string {
    return `ur:crypto-psbt/${psbtBase64}`;
  }

  importSignedPsbtFromQr(qrPayload: string): string {
    if (!qrPayload.startsWith('ur:crypto-psbt/')) {
      throw new Error('Unsupported external signer QR payload');
    }
    return qrPayload.replace('ur:crypto-psbt/', '');
  }
}
