import { useEffect, useMemo, useState } from 'react';
import { UniversalQrService } from '@bursh/qr-engine';
import type { ParsedQRPayload } from '@bursh/shared-types';
import { HomeActions } from './components/HomeActions';

const SENSITIVE_TYPES = new Set<ParsedQRPayload['type']>(['bip39', 'psbt']);

const toUiError = (error: unknown): string => {
  if (error instanceof Error) {
    return `Falha ao processar payload (${error.name})`;
  }
  return 'Falha ao processar payload';
};

const formatMetadata = (payload: ParsedQRPayload): string | undefined => {
  if (!payload.metadata) return undefined;

  const network = payload.metadata.network;
  if (typeof network === 'string') {
    return `Rede detectada: ${network}`;
  }

  return undefined;
};

export function App() {
  const [scannerInput, setScannerInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [detected, setDetected] = useState<ParsedQRPayload | undefined>();
  const [autoClearedSensitiveData, setAutoClearedSensitiveData] = useState(false);
  const detector = useMemo(() => new UniversalQrService(), []);

  const isInputEmpty = scannerInput.trim().length === 0;

  const handleManualClear = () => {
    setScannerInput('');
    setDetected(undefined);
    setErrorMessage(undefined);
    setAutoClearedSensitiveData(false);
  };

  useEffect(() => {
    if (!scannerInput) {
      return;
    }

    try {
      const payload = detector.detectPayload(scannerInput);
      const isSensitive = SENSITIVE_TYPES.has(payload.type);

      setDetected(payload);
      setErrorMessage(undefined);
      setAutoClearedSensitiveData(isSensitive);

      if (isSensitive) {
        setScannerInput('');
      }
    } catch (error) {
      setDetected(undefined);
      setAutoClearedSensitiveData(false);
      setErrorMessage(toUiError(error));
    }
  }, [detector, scannerInput]);

  const detectionStateMessage = errorMessage
    ? 'erro no parsing'
    : detected
      ? `payload reconhecido (${detected.type})`
      : 'aguardando entrada';

  return (
    <main className="container">
      <h1>Bitcoin Universal Recovery & Signing Hub</h1>
      <p>Offline-first | Zona 0 (RAM only) | QR-centric UX</p>

      <section className="panel">
        <h2>Entrada Universal via QR</h2>
        <p className="hint">
          Cole um payload para testar a detecção local (seed BIP39, xpub/ypub/zpub, PSBT, invoice
          Lightning ou endereço Bitcoin).
        </p>

        <label className="input-label" htmlFor="payload-input">
          Payload de teste
        </label>
        <textarea
          id="payload-input"
          value={scannerInput}
          onChange={(event) => setScannerInput(event.target.value)}
          placeholder="Cole o payload lido do QR"
          rows={4}
        />

        <p className="input-state">Estado da entrada: {isInputEmpty ? 'vazia' : 'preenchida'}</p>

        <div className="actions-row">
          <button type="button" onClick={handleManualClear}>
            Limpar payload da memória
          </button>
        </div>

        <p className="detection-state">Estado da detecção: {detectionStateMessage}</p>

        {detected ? <p className="result">Tipo detectado: {detected.type}</p> : null}
        {detected && formatMetadata(detected) ? (
          <p className="metadata">{formatMetadata(detected)}</p>
        ) : null}
        {detected?.type === 'lightning_invoice' ? (
          <p className="experimental-notice">
            Validação de Lightning invoice ainda heurística (baseada em prefixo), sujeita a falso
            positivo em payload truncado.
          </p>
        ) : null}
        {autoClearedSensitiveData ? (
          <p className="sensitive-notice">
            Payload sensível detectado ({detected?.type}). O campo de entrada foi limpo
            automaticamente e os dados não são persistidos em storage local.
          </p>
        ) : null}
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </section>

      <HomeActions />
    </main>
  );
}
