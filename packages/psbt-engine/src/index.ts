import { Psbt } from 'bitcoinjs-lib';
import type { ExternalSignerAdapter, PsbtService } from '@bursh/core-domain';

const decodePsbt = (input: string): Psbt => {
  const trimmed = input.trim();
  try {
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      return Psbt.fromHex(trimmed);
    }
    return Psbt.fromBase64(trimmed);
  } catch {
    throw new Error('PSBT inválida: payload não pôde ser decodificado');
  }
};

const assertStructuralRules = (psbt: Psbt): void => {
  if (!psbt.data.globalMap.unsignedTx) {
    throw new Error('PSBT inválida: unsigned tx ausente');
  }

  const tx = psbt.txInputs;
  const outputs = psbt.txOutputs;
  if (tx.length === 0) throw new Error('PSBT inválida: transação sem inputs');
  if (outputs.length === 0) throw new Error('PSBT inválida: transação sem outputs');

  if (psbt.data.inputs.length !== tx.length) {
    throw new Error('PSBT inválida: número de input maps inconsistente');
  }

  if (psbt.data.outputs.length !== outputs.length) {
    throw new Error('PSBT inválida: número de output maps inconsistente');
  }

  psbt.data.inputs.forEach((input, index) => {
    if (!input.witnessUtxo && !input.nonWitnessUtxo) {
      throw new Error(`PSBT inválida: input ${index} sem UTXO de referência`);
    }
    if (input.witnessUtxo && input.nonWitnessUtxo) {
      throw new Error(`PSBT inválida: input ${index} com witnessUtxo e nonWitnessUtxo ao mesmo tempo`);
    }
  });
};

export class DefaultPsbtService implements PsbtService {
  createPsbt(inputs: string[], outputs: Array<{ address: string; amountSats: number }>): string {
    const psbt = new Psbt();

    for (const input of inputs) {
      const [txid, voutRaw, amountRaw] = input.split(':');
      const vout = Number(voutRaw);
      const amountSats = Number(amountRaw);
      if (!txid || !Number.isInteger(vout) || vout < 0 || !Number.isInteger(amountSats) || amountSats <= 0) {
        throw new Error('Input PSBT inválido. Use formato txid:vout:amountSats');
      }

      psbt.addInput({
        hash: txid,
        index: vout,
        witnessUtxo: {
          script: Buffer.alloc(0),
          value: amountSats
        }
      });
    }

    for (const output of outputs) {
      if (!Number.isInteger(output.amountSats) || output.amountSats <= 0) {
        throw new Error('Output PSBT inválido: amountSats deve ser inteiro positivo');
      }
      psbt.addOutput({ address: output.address, value: output.amountSats });
    }

    return psbt.toBase64();
  }

  validatePsbt(psbtBase64: string): boolean {
    try {
      const psbt = decodePsbt(psbtBase64);
      assertStructuralRules(psbt);
      return true;
    } catch {
      return false;
    }
  }

  finalizePsbt(psbtBase64: string): string {
    const psbt = decodePsbt(psbtBase64);
    assertStructuralRules(psbt);

    return `finalized:inputs=${psbt.txInputs.length};outputs=${psbt.txOutputs.length}`;
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
