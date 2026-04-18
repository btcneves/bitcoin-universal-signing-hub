import { useMemo, useState } from 'react';
import { UniversalQrService } from '@bursh/qr-engine';
import { HomeActions } from './components/HomeActions';

export function App() {
  const [input, setInput] = useState('');
  const detector = useMemo(() => new UniversalQrService(), []);
  const detected = input ? detector.detectPayload(input) : undefined;

  return (
    <main className="container">
      <h1>Bitcoin Universal Recovery & Signing Hub</h1>
      <p>Offline-first | Zona 0 (RAM only) | QR-centric UX</p>

      <section className="panel">
        <h2>Entrada Universal via QR</h2>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Cole o payload lido do QR"
          rows={4}
        />
        {detected ? <p className="result">Tipo detectado: {detected.type}</p> : null}
      </section>

      <HomeActions />
    </main>
  );
}
