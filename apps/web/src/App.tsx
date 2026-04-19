import { useEffect, useMemo, useState } from 'react';
import { UniversalQrService } from '@bursh/qr-engine';
import type { ParsedQRPayload } from '@bursh/shared-types';
import { HomeActions } from './components/HomeActions';

const SENSITIVE_TYPES = new Set<ParsedQRPayload['type']>(['bip39', 'psbt']);

const SAMPLE_HINTS = [
  'Válido (xpub): xpub6D8Q6... (prefixo xpub/ypub/zpub)',
  'Válido (endereço): bc1q... ou tb1q...',
  'Válido (Lightning): lnbc... / lntb... (heurístico)',
  'Inválido (controle): texto-livre-123 sem formato conhecido'
];
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_MAP = new Map([...BASE64_ALPHABET].map((c, i) => [c, i]));

const WATCH_ONLY_TYPES = new Set<ParsedQRPayload['type']>(['xpub', 'ypub', 'zpub']);
const isWatchOnlyType = (type: ParsedQRPayload['type']): type is 'xpub' | 'ypub' | 'zpub' =>
  WATCH_ONLY_TYPES.has(type);

export type DetectionSnapshot = {
  scannerInput: string;
  errorMessage?: string;
  detected?: ParsedQRPayload;
  autoClearedSensitiveData: boolean;
  lastActionMessage?: string;
};

export type WatchOnlySnapshot = {
  ready: boolean;
  keyType?: 'xpub' | 'ypub' | 'zpub';
  network?: 'mainnet' | 'testnet';
  accountModel?: string;
  scriptPolicy?: string;
  derivationScope?: string;
  descriptorPreview?: string;
  keyFingerprint?: string;
  localPreviewPaths?: string[];
  uiStateMessage?: string;
};

export type WatchOnlyPreparationSnapshot = {
  prepared: boolean;
  statusLabel: string;
  guidance: string;
};

export type PsbtReviewSnapshot = {
  ready: boolean;
  statusLabel: string;
  guidance: string;
  detectedFormat?: 'base64' | 'ur:crypto-psbt';
  payloadSizeBytes?: number;
  txVersion?: number;
  inputCount?: number;
  outputCount?: number;
  fingerprint?: string;
};

const toUiError = (error: unknown): string => {
  if (error instanceof Error) {
    return `Falha ao processar payload (${error.name}). Revise formato e conteúdo do texto colado.`;
  }

  return 'Falha ao processar payload. Revise formato e conteúdo do texto colado.';
};

const formatMetadata = (payload: ParsedQRPayload): string | undefined => {
  if (!payload.metadata) return undefined;

  const network = payload.metadata.network;
  if (typeof network === 'string') {
    return `Rede detectada: ${network}`;
  }

  return undefined;
};

export const getDetectionMaturity = (type?: ParsedQRPayload['type']): string => {
  if (!type || type === 'unknown') {
    return 'não aplicável';
  }

  if (type === 'lightning_invoice') {
    return 'heurístico';
  }

  return 'estável';
};

const getWatchOnlyAccountModel = (type: 'xpub' | 'ypub' | 'zpub'): string => {
  if (type === 'xpub') return 'legado/compatível (xpub)';
  if (type === 'ypub') return 'segwit aninhado (P2WPKH-in-P2SH)';
  return 'segwit nativo (P2WPKH)';
};

const getWatchOnlyDerivationScope = (type: 'xpub' | 'ypub' | 'zpub'): string => {
  if (type === 'xpub') return "BIP44 padrão de conta: m/44'/0'/0'";
  if (type === 'ypub') return "BIP49 padrão de conta: m/49'/0'/0'";
  return "BIP84 padrão de conta: m/84'/0'/0'";
};

const getWatchOnlyScriptPolicy = (type: 'xpub' | 'ypub' | 'zpub'): string => {
  if (type === 'xpub') return 'P2PKH (legacy)';
  if (type === 'ypub') return 'P2WPKH-in-P2SH (segwit aninhado)';
  return 'P2WPKH (segwit nativo)';
};

const buildDescriptorPreview = (type: 'xpub' | 'ypub' | 'zpub', raw: string): string => {
  const redacted = `${raw.slice(0, 8)}...${raw.slice(-8)}`;
  if (type === 'xpub') return `pkh(${redacted}/0/*)`;
  if (type === 'ypub') return `sh(wpkh(${redacted}/0/*))`;
  return `wpkh(${redacted}/0/*)`;
};

const buildKeyFingerprint = (raw: string): string => {
  if (raw.length <= 14) return raw;
  return `${raw.slice(0, 7)}...${raw.slice(-7)}`;
};

const decodeBase64ToBytes = (value: string): Uint8Array | undefined => {
  const normalized = value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!normalized) return undefined;
  const unpadded = normalized.replace(/=+$/g, '');
  if (!unpadded || unpadded.includes('=')) return undefined;

  const missingPadding = unpadded.length % 4;
  if (missingPadding === 1) return undefined;
  const padded = missingPadding === 0 ? unpadded : `${unpadded}${'='.repeat(4 - missingPadding)}`;

  const out: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const c0 = padded[i];
    const c1 = padded[i + 1];
    const c2 = padded[i + 2];
    const c3 = padded[i + 3];
    if (!c0 || !c1 || !c2 || !c3) return undefined;

    const v0 = BASE64_MAP.get(c0);
    const v1 = BASE64_MAP.get(c1);
    const v2 = c2 === '=' ? 0 : BASE64_MAP.get(c2);
    const v3 = c3 === '=' ? 0 : BASE64_MAP.get(c3);
    if (v0 === undefined || v1 === undefined || v2 === undefined || v3 === undefined) {
      return undefined;
    }
    if (c2 === '=' && c3 !== '=') return undefined;
    if ((c2 === '=' || c3 === '=') && i + 4 !== padded.length) return undefined;

    const combined = (v0 << 18) | (v1 << 12) | (v2 << 6) | v3;
    out.push((combined >> 16) & 0xff);
    if (c2 !== '=') out.push((combined >> 8) & 0xff);
    if (c3 !== '=') out.push(combined & 0xff);
  }

  return new Uint8Array(out);
};

const readCompactSize = (
  bytes: Uint8Array,
  offset: number
): { value: number; next: number } | undefined => {
  const first = bytes[offset];
  if (first === undefined) return undefined;
  if (first < 0xfd) return { value: first, next: offset + 1 };

  if (first === 0xfd) {
    const b0 = bytes[offset + 1];
    const b1 = bytes[offset + 2];
    if (b0 === undefined || b1 === undefined) return undefined;
    return { value: b0 | (b1 << 8), next: offset + 3 };
  }

  if (first === 0xfe) {
    const b0 = bytes[offset + 1];
    const b1 = bytes[offset + 2];
    const b2 = bytes[offset + 3];
    const b3 = bytes[offset + 4];
    if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) {
      return undefined;
    }
    return { value: (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0, next: offset + 5 };
  }

  return undefined;
};

const parsePsbtGlobalMap = (
  bytes: Uint8Array
): { next: number; unsignedTx?: Uint8Array } | undefined => {
  let cursor = 5;

  while (cursor < bytes.length) {
    const keyLen = readCompactSize(bytes, cursor);
    if (!keyLen) return undefined;
    cursor = keyLen.next;

    if (keyLen.value === 0) {
      return { next: cursor };
    }

    if (cursor + keyLen.value > bytes.length) return undefined;
    const key = bytes.subarray(cursor, cursor + keyLen.value);
    cursor += keyLen.value;

    const valueLen = readCompactSize(bytes, cursor);
    if (!valueLen) return undefined;
    cursor = valueLen.next;

    if (cursor + valueLen.value > bytes.length) return undefined;
    const value = bytes.subarray(cursor, cursor + valueLen.value);
    cursor += valueLen.value;

    if (key.length > 0 && key[0] === 0x00) {
      return { next: cursor, unsignedTx: value };
    }
  }

  return undefined;
};

const parseUnsignedTxSummary = (
  tx: Uint8Array
): { txVersion?: number; inputCount?: number; outputCount?: number } => {
  if (tx.length < 8) return {};

  const view = new DataView(tx.buffer, tx.byteOffset, tx.byteLength);
  const txVersion = view.getUint32(0, true);
  let cursor = 4;

  const inputCountVarint = readCompactSize(tx, cursor);
  if (!inputCountVarint) return { txVersion };
  const inputCount = inputCountVarint.value;
  cursor = inputCountVarint.next;

  for (let i = 0; i < inputCount; i += 1) {
    if (cursor + 36 > tx.length) return { txVersion, inputCount };
    cursor += 36;

    const scriptLen = readCompactSize(tx, cursor);
    if (!scriptLen) return { txVersion, inputCount };
    cursor = scriptLen.next;

    if (cursor + scriptLen.value + 4 > tx.length) return { txVersion, inputCount };
    cursor += scriptLen.value + 4;
  }

  const outputCountVarint = readCompactSize(tx, cursor);
  if (!outputCountVarint) return { txVersion, inputCount };

  return { txVersion, inputCount, outputCount: outputCountVarint.value };
};

const toHexPreview = (bytes: Uint8Array): string => {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (hex.length <= 16) return hex;
  return `${hex.slice(0, 8)}...${hex.slice(-8)}`;
};

export const buildPsbtReviewSnapshot = (
  detected?: ParsedQRPayload,
  autoClearedSensitiveData = false
): PsbtReviewSnapshot => {
  if (!detected || detected.type !== 'psbt') {
    return {
      ready: false,
      statusLabel: 'PSBT indisponível',
      guidance: 'Carregue uma PSBT válida para habilitar revisão offline local.'
    };
  }

  const isUrFormat = detected.raw.trim().startsWith('ur:crypto-psbt/');
  const encoded = isUrFormat ? detected.raw.trim().slice('ur:crypto-psbt/'.length) : detected.raw;
  const decoded = decodeBase64ToBytes(encoded);
  const globalMap = decoded ? parsePsbtGlobalMap(decoded) : undefined;
  const txSummary = globalMap?.unsignedTx ? parseUnsignedTxSummary(globalMap.unsignedTx) : {};
  const snapshot: PsbtReviewSnapshot = {
    ready: true,
    statusLabel: autoClearedSensitiveData
      ? 'PSBT pronta para revisão offline'
      : 'PSBT detectada para revisão local',
    guidance:
      'Revise resumo local e prossiga para assinatura externa apenas na etapa seguinte. Nesta fase não há assinatura nem broadcast.',
    detectedFormat: isUrFormat ? 'ur:crypto-psbt' : 'base64'
  };

  if (decoded) {
    snapshot.payloadSizeBytes = decoded.length;
    snapshot.fingerprint = toHexPreview(decoded.subarray(0, 8));
  }
  if (txSummary.txVersion !== undefined) snapshot.txVersion = txSummary.txVersion;
  if (txSummary.inputCount !== undefined) snapshot.inputCount = txSummary.inputCount;
  if (txSummary.outputCount !== undefined) snapshot.outputCount = txSummary.outputCount;

  return snapshot;
};

export const buildWatchOnlySnapshot = (detected?: ParsedQRPayload): WatchOnlySnapshot => {
  if (!detected || !isWatchOnlyType(detected.type)) {
    return { ready: false, uiStateMessage: 'Watch-only indisponível para o payload atual.' };
  }

  const keyType = detected.type;
  const network = detected.metadata?.network;
  const normalizedNetwork = network === 'testnet' ? 'testnet' : 'mainnet';

  return {
    ready: true,
    keyType,
    network: normalizedNetwork,
    accountModel: getWatchOnlyAccountModel(keyType),
    scriptPolicy: getWatchOnlyScriptPolicy(keyType),
    derivationScope: getWatchOnlyDerivationScope(keyType),
    descriptorPreview: buildDescriptorPreview(keyType, detected.raw),
    keyFingerprint: buildKeyFingerprint(detected.raw),
    localPreviewPaths: ['/0/0 (recebimento)', '/0/1 (recebimento)', '/1/0 (troco)'],
    uiStateMessage: 'Watch-only pronto para revisão offline da carteira.'
  };
};

export const buildWatchOnlyPreparationSnapshot = (
  watchOnly: WatchOnlySnapshot,
  prepared: boolean
): WatchOnlyPreparationSnapshot => {
  if (!watchOnly.ready) {
    return {
      prepared: false,
      statusLabel: 'Não preparado',
      guidance: 'Carregue um xpub/ypub/zpub válido para preparar um perfil watch-only local.'
    };
  }

  if (!prepared) {
    return {
      prepared: false,
      statusLabel: 'Pendente de confirmação local',
      guidance:
        'Revise escopo de derivação e política de script. Depois, marque o perfil como preparado para uso watch-only offline.'
    };
  }

  return {
    prepared: true,
    statusLabel: 'Watch-only preparado (local)',
    guidance:
      'Perfil pronto para exportação manual em visualizador watch-only, sem seed, sem passphrase e sem rede nesta etapa.'
  };
};

export const buildManualClearSnapshot = (scannerInput: string): DetectionSnapshot => {
  const hadVisibleInput = scannerInput.trim().length > 0;

  return {
    scannerInput: '',
    autoClearedSensitiveData: false,
    lastActionMessage: hadVisibleInput
      ? 'Payload removido da área de teste manual.'
      : 'Área de teste já estava limpa.'
  };
};

export const buildDetectionSnapshot = (
  detector: UniversalQrService,
  scannerInput: string
): DetectionSnapshot | undefined => {
  if (!scannerInput) {
    return undefined;
  }

  try {
    const payload = detector.detectPayload(scannerInput);
    const isSensitive = SENSITIVE_TYPES.has(payload.type);

    return {
      scannerInput: isSensitive ? '' : scannerInput,
      detected: payload,
      autoClearedSensitiveData: isSensitive
    };
  } catch (error) {
    return {
      scannerInput,
      autoClearedSensitiveData: false,
      errorMessage: toUiError(error)
    };
  }
};

export function App() {
  const [scannerInput, setScannerInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [detected, setDetected] = useState<ParsedQRPayload | undefined>();
  const [autoClearedSensitiveData, setAutoClearedSensitiveData] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | undefined>();
  const [watchOnlyPrepared, setWatchOnlyPrepared] = useState(false);
  const detector = useMemo(() => new UniversalQrService(), []);

  const isInputEmpty = scannerInput.trim().length === 0;

  const handleManualClear = () => {
    const snapshot = buildManualClearSnapshot(scannerInput);
    setScannerInput(snapshot.scannerInput);
    setDetected(snapshot.detected);
    setErrorMessage(snapshot.errorMessage);
    setAutoClearedSensitiveData(snapshot.autoClearedSensitiveData);
    setLastActionMessage(snapshot.lastActionMessage);
  };

  useEffect(() => {
    const snapshot = buildDetectionSnapshot(detector, scannerInput);
    if (!snapshot) {
      return;
    }

    setDetected(snapshot.detected);
    setErrorMessage(snapshot.errorMessage);
    setAutoClearedSensitiveData(snapshot.autoClearedSensitiveData);
    setLastActionMessage(snapshot.lastActionMessage);

    if (snapshot.scannerInput !== scannerInput) {
      setScannerInput(snapshot.scannerInput);
    }
  }, [detector, scannerInput]);

  const detectionStateMessage = errorMessage
    ? 'erro no parsing local'
    : detected
      ? `payload reconhecido (${detected.type})`
      : 'aguardando entrada';

  const detectedType = detected?.type;
  const detectionMaturity = getDetectionMaturity(detectedType);
  const watchOnly = buildWatchOnlySnapshot(detected);
  const watchOnlyPreparation = buildWatchOnlyPreparationSnapshot(watchOnly, watchOnlyPrepared);
  const psbtReview = buildPsbtReviewSnapshot(detected, autoClearedSensitiveData);

  useEffect(() => {
    setWatchOnlyPrepared(false);
  }, [detected?.raw, watchOnly.ready]);

  return (
    <main className="container">
      <h1>Bitcoin Universal Recovery & Signing Hub</h1>
      <p>Offline-first | Zona 0 (RAM only) | QR-centric UX</p>

      <section className="panel">
        <h2>Entrada Universal via QR</h2>
        <p className="hint">
          Cole um payload para testar a detecção local (seed BIP39, xpub/ypub/zpub, PSBT, invoice
          Lightning ou endereço Bitcoin). Este painel é focado em validação manual de formato.
        </p>

        <details className="payload-hints">
          <summary>Dicas rápidas para teste (válido e inválido)</summary>
          <ul>
            {SAMPLE_HINTS.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </details>

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

        {lastActionMessage ? <p className="clear-feedback">{lastActionMessage}</p> : null}

        <p className="detection-state">Estado da detecção: {detectionStateMessage}</p>

        {detected ? <p className="result">Tipo detectado: {detected.type}</p> : null}
        {detected ? (
          <p className="maturity">Classificação da detecção: {detectionMaturity}</p>
        ) : null}
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
            automaticamente e a área de teste permanece sem payload visível.
          </p>
        ) : null}
        {errorMessage ? <p className="error">{errorMessage}</p> : null}

        {watchOnly.ready ? (
          <section className="watch-only-panel">
            <h3>Watch-only pronto (MVP local)</h3>
            <p className="watch-only-state">Estado: {watchOnly.uiStateMessage}</p>
            <ul>
              <li>Tipo de extended pubkey: {watchOnly.keyType}</li>
              <li>Rede detectada: {watchOnly.network}</li>
              <li>Modelo de conta esperado: {watchOnly.accountModel}</li>
              <li>Política de script inferida: {watchOnly.scriptPolicy}</li>
              <li>Escopo de derivação esperado: {watchOnly.derivationScope}</li>
              <li>Identificador curto da chave: {watchOnly.keyFingerprint}</li>
              <li>Prévia de descriptor local: {watchOnly.descriptorPreview}</li>
            </ul>
            <p className="watch-only-next-step-title">Prévia local derivada (sem rede):</p>
            <ul>
              {watchOnly.localPreviewPaths?.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
            <p className="watch-only-next-step-title">Status de preparação:</p>
            <p className="watch-only-state">{watchOnlyPreparation.statusLabel}</p>
            <p className="watch-only-guidance">{watchOnlyPreparation.guidance}</p>
            <button type="button" onClick={() => setWatchOnlyPrepared(true)}>
              Marcar watch-only como preparado (local)
            </button>
            <p className="watch-only-next-step-title">Próximos passos sugeridos:</p>
            <ol>
              <li>Confirmar se a rede e o tipo de chave batem com a carteira de origem.</li>
              <li>Validar o propósito da conta antes de importar em um visualizador watch-only.</li>
              <li>
                Prosseguir sem inserir seed, passphrase, PSBT ou qualquer material sensível neste
                fluxo.
              </li>
            </ol>
          </section>
        ) : null}

        {psbtReview.ready ? (
          <section className="psbt-panel">
            <h3>PSBT pronta para revisão offline (MVP local)</h3>
            <p className="psbt-state">Estado: {psbtReview.statusLabel}</p>
            <ul>
              <li>Formato detectado: {psbtReview.detectedFormat}</li>
              <li>Tamanho do payload decodificado: {psbtReview.payloadSizeBytes ?? 'n/d'} bytes</li>
              <li>Versão da transação unsigned: {psbtReview.txVersion ?? 'n/d'}</li>
              <li>Entradas detectadas: {psbtReview.inputCount ?? 'n/d'}</li>
              <li>Saídas detectadas: {psbtReview.outputCount ?? 'n/d'}</li>
              <li>Fingerprint curta local: {psbtReview.fingerprint ?? 'n/d'}</li>
            </ul>
            <p className="psbt-guidance">{psbtReview.guidance}</p>
            <p className="psbt-next-step-title">Próximos passos sugeridos:</p>
            <ol>
              <li>Comparar contagem de entradas/saídas com o contexto da transação esperada.</li>
              <li>Exportar/encaminhar a PSBT para assinador externo em ambiente controlado.</li>
              <li>Retornar com PSBT assinada para etapa futura de validação e finalização.</li>
            </ol>
          </section>
        ) : null}
      </section>

      <HomeActions />
    </main>
  );
}
