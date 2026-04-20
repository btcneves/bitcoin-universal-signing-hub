import { HDKey } from '@scure/bip32';
import { Bip39Service } from '@bursh/bitcoin-engine';
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
      throw new Error(
        `PSBT inválida: input ${index} com witnessUtxo e nonWitnessUtxo ao mesmo tempo`
      );
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
      if (
        !txid ||
        !Number.isInteger(vout) ||
        vout < 0 ||
        !Number.isInteger(amountSats) ||
        amountSats <= 0
      ) {
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

    try {
      psbt.finalizeAllInputs();
      return psbt.extractTransaction().toHex();
    } catch {
      throw new Error(
        'PSBT não pôde ser finalizada: assinaturas/final scripts ausentes ou inválidos'
      );
    }
  }

  signPsbtWithMnemonic(
    psbtInput: string,
    mnemonic: string,
    passphrase = '',
    options?: { finalize?: boolean }
  ): { signedPsbtBase64: string; txHex?: string } {
    const psbt = decodePsbt(psbtInput);
    assertStructuralRules(psbt);

    const bip39 = new Bip39Service();
    const seed = bip39.generateSeed(mnemonic, passphrase);

    try {
      const master = HDKey.fromMasterSeed(seed);
      psbt.signAllInputsHD(master as never);

      let txHex: string | undefined;
      if (options?.finalize !== false) {
        psbt.finalizeAllInputs();
        txHex = psbt.extractTransaction().toHex();
      }

      const result: { signedPsbtBase64: string; txHex?: string } = {
        signedPsbtBase64: psbt.toBase64()
      };
      if (txHex) result.txHex = txHex;
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Falha na assinatura PSBT: ${error.message}`);
      }
      throw new Error('Falha na assinatura PSBT');
    } finally {
      bip39.secureWipe(seed);
    }
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

export const encodePsbtForQr = (psbtBase64: string): string =>
  `ur:crypto-psbt/${psbtBase64.trim()}`;
export const decodePsbtFromQr = (payload: string): string =>
  payload.startsWith('ur:crypto-psbt/') ? payload.slice('ur:crypto-psbt/'.length) : payload;
