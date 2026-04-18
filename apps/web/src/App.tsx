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

export function App() {
  const [scannerInput, setScannerInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [detected, setDetected] = useState<ParsedQRPayload | undefined>();
  const detector = useMemo(() => new UniversalQrService(), []);

  useEffect(() => {
    if (!scannerInput) {
      setDetected(undefined);
      return;
    }

    try {
      const payload = detector.detectPayload(scannerInput);
      setDetected(payload);
      setErrorMessage(undefined);

      if (SENSITIVE_TYPES.has(payload.type)) {
        setScannerInput('');
      }
    } catch (error) {
      setDetected(undefined);
      setErrorMessage(toUiError(error));
    }
  }, [detector, scannerInput]);

  return (
    <main className="container">
      <h1>Bitcoin Universal Recovery & Signing Hub</h1>
      <p>Offline-first | Zona 0 (RAM only) | QR-centric UX</p>

      <section className="panel">
        <h2>Entrada Universal via QR</h2>
        <textarea
          value={scannerInput}
          onChange={(event) => setScannerInput(event.target.value)}
          placeholder="Cole o payload lido do QR"
          rows={4}
        />
        <div className="actions-row">
          <button type="button" onClick={() => setScannerInput('')}>
            Limpar payload da memória
          </button>
        </div>

        {detected ? <p className="result">Tipo detectado: {detected.type}</p> : null}
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </section>

      <HomeActions />
    </main>
  );
}
