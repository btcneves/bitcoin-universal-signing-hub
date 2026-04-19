import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

type CameraEnvironment = {
  isSecureContext?: boolean;
  BarcodeDetector?: BarcodeDetectorCtor;
  navigator?: {
    mediaDevices?: {
      getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
    };
  };
};

export type DetectionSnapshot = {
  scannerInput: string;
  errorMessage?: string;
  detected?: ParsedQRPayload;
  autoClearedSensitiveData: boolean;
  lastActionMessage?: string;
};

export type ScannerInputMode = 'manual' | 'camera';
export type CameraSupportStatus =
  | 'supported'
  | 'missing-secure-context'
  | 'missing-barcode-detector'
  | 'missing-media-devices';

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

export type PsbtHandoffSnapshot = {
  reviewCompleted: boolean;
  readyToHandoff: boolean;
  statusLabel: string;
  guidance: string;
  localCheckpointLabel: string;
  flowStages: {
    localReview: 'done' | 'active';
    futureExport: 'pending' | 'ready';
    futureExternalSigning: 'pending';
    futureValidationAndFinalize: 'pending';
  };
};

export type PsbtForwardingSnapshot = {
  ready: boolean;
  prepared: boolean;
  statusLabel: string;
  guidance: string;
  localForwardingLabel: string;
  forwardingToken?: string;
  flowBridge: {
    localReviewCheckpoint: 'blocked' | 'done';
    localForwardingPreparation: 'blocked' | 'available' | 'done';
    externalSigningFuture: 'pending';
    validationAndFinalizeFuture: 'pending';
  };
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

const isAsciiWhitespace = (charCode: number): boolean =>
  charCode === 0x20 || (charCode >= 0x09 && charCode <= 0x0d);

const normalizeBase64Input = (value: string): string | undefined => {
  let body = '';
  let sawPadding = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (!char) return undefined;
    const charCode = char.charCodeAt(0);
    if (isAsciiWhitespace(charCode)) continue;

    if (char === '=') {
      sawPadding = true;
      continue;
    }

    if (sawPadding) return undefined;
    if (char === '-') {
      body += '+';
      continue;
    }
    if (char === '_') {
      body += '/';
      continue;
    }
    body += char;
  }

  if (!body) return undefined;
  return body;
};

const decodeBase64ToBytes = (value: string): Uint8Array | undefined => {
  const normalized = normalizeBase64Input(value);
  if (!normalized) return undefined;

  const missingPadding = normalized.length % 4;
  if (missingPadding === 1) return undefined;
  const padded =
    missingPadding === 0 ? normalized : `${normalized}${'='.repeat(4 - missingPadding)}`;

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

export const buildPsbtHandoffSnapshot = (
  psbtReview: PsbtReviewSnapshot,
  reviewCompleted: boolean
): PsbtHandoffSnapshot => {
  if (!psbtReview.ready) {
    return {
      reviewCompleted: false,
      readyToHandoff: false,
      statusLabel: 'Aguardando PSBT válida',
      guidance:
        'Carregue uma PSBT válida para habilitar checkpoint local de revisão e preparar encaminhamento futuro.',
      localCheckpointLabel: 'Checkpoint local indisponível',
      flowStages: {
        localReview: 'active',
        futureExport: 'pending',
        futureExternalSigning: 'pending',
        futureValidationAndFinalize: 'pending'
      }
    };
  }

  if (!reviewCompleted) {
    return {
      reviewCompleted: false,
      readyToHandoff: false,
      statusLabel: 'Revisão local pendente',
      guidance:
        'Conclua o checkpoint local da revisão PSBT para sinalizar preparo de encaminhamento externo futuro (sem exportar nesta etapa).',
      localCheckpointLabel: 'Checkpoint local pendente',
      flowStages: {
        localReview: 'active',
        futureExport: 'pending',
        futureExternalSigning: 'pending',
        futureValidationAndFinalize: 'pending'
      }
    };
  }

  return {
    reviewCompleted: true,
    readyToHandoff: true,
    statusLabel: 'PSBT pronta para encaminhamento externo futuro',
    guidance:
      'Revisão local concluída. Próxima etapa futura: exportar/encaminhar para assinador externo controlado, sem assinatura real nesta versão.',
    localCheckpointLabel: 'Checkpoint local concluído',
    flowStages: {
      localReview: 'done',
      futureExport: 'ready',
      futureExternalSigning: 'pending',
      futureValidationAndFinalize: 'pending'
    }
  };
};

const buildForwardingToken = (fingerprint?: string): string => {
  if (!fingerprint) return 'psbt-local-unknown';
  return `psbt-local-${fingerprint.replace('...', '')}`;
};

export const buildPsbtForwardingSnapshot = (
  psbtHandoff: PsbtHandoffSnapshot,
  forwardingPrepared: boolean,
  psbtReview: PsbtReviewSnapshot
): PsbtForwardingSnapshot => {
  if (!psbtHandoff.readyToHandoff) {
    return {
      ready: false,
      prepared: false,
      statusLabel: 'Encaminhamento local bloqueado',
      guidance:
        'Conclua primeiro o checkpoint de revisão PSBT para liberar o preparo local de encaminhamento externo futuro.',
      localForwardingLabel: 'Preparação indisponível',
      flowBridge: {
        localReviewCheckpoint: 'blocked',
        localForwardingPreparation: 'blocked',
        externalSigningFuture: 'pending',
        validationAndFinalizeFuture: 'pending'
      }
    };
  }

  if (!forwardingPrepared) {
    return {
      ready: true,
      prepared: false,
      statusLabel: 'Encaminhamento local disponível',
      guidance:
        'A revisão local já foi concluída. Prepare agora um checkpoint local de encaminhamento para uso com assinador externo em etapa futura.',
      localForwardingLabel: 'Preparação pendente',
      forwardingToken: buildForwardingToken(psbtReview.fingerprint),
      flowBridge: {
        localReviewCheckpoint: 'done',
        localForwardingPreparation: 'available',
        externalSigningFuture: 'pending',
        validationAndFinalizeFuture: 'pending'
      }
    };
  }

  return {
    ready: true,
    prepared: true,
    statusLabel: 'Encaminhamento local preparado (simulação offline)',
    guidance:
      'Checkpoint local concluído. A próxima integração futura poderá exportar/encaminhar para assinador externo mantendo esta separação de etapas.',
    localForwardingLabel: 'Preparação concluída',
    forwardingToken: buildForwardingToken(psbtReview.fingerprint),
    flowBridge: {
      localReviewCheckpoint: 'done',
      localForwardingPreparation: 'done',
      externalSigningFuture: 'pending',
      validationAndFinalizeFuture: 'pending'
    }
  };
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

export const getCameraSupportStatus = (
  env: CameraEnvironment = globalThis as CameraEnvironment
): CameraSupportStatus => {
  if (env.isSecureContext === false) return 'missing-secure-context';
  if (!env.BarcodeDetector) return 'missing-barcode-detector';
  if (!env.navigator?.mediaDevices?.getUserMedia) return 'missing-media-devices';
  return 'supported';
};

export const getCameraSupportMessage = (status: CameraSupportStatus): string | undefined => {
  if (status === 'supported') return undefined;
  if (status === 'missing-secure-context') {
    return 'Leitura por câmera requer contexto seguro (HTTPS ou localhost).';
  }
  if (status === 'missing-barcode-detector') {
    return 'Leitura por câmera indisponível neste navegador (BarcodeDetector não suportado).';
  }
  return 'Leitura por câmera indisponível (API de câmera não suportada).';
};

export const resolveRequestedInputMode = (
  requestedMode: ScannerInputMode,
  supportStatus: CameraSupportStatus
): ScannerInputMode =>
  requestedMode === 'camera' && supportStatus !== 'supported' ? 'manual' : requestedMode;

export const toCameraStartErrorMessage = (error: unknown): string => {
  const errorName =
    typeof error === 'object' && error && 'name' in error ? String(error.name) : undefined;

  if (errorName === 'NotAllowedError') {
    return 'Permissão de câmera negada. Continue com entrada manual.';
  }
  if (errorName === 'NotFoundError') {
    return 'Nenhuma câmera disponível. Continue com entrada manual.';
  }
  if (errorName === 'NotReadableError') {
    return 'Não foi possível acessar a câmera no momento. Continue com entrada manual.';
  }
  return 'Falha ao iniciar leitura por câmera. Continue com entrada manual.';
};

export function App() {
  const [scannerInput, setScannerInput] = useState('');
  const [inputMode, setInputMode] = useState<ScannerInputMode>('manual');
  const [cameraStatusMessage, setCameraStatusMessage] = useState<string | undefined>();
  const [cameraScanning, setCameraScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [detected, setDetected] = useState<ParsedQRPayload | undefined>();
  const [autoClearedSensitiveData, setAutoClearedSensitiveData] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | undefined>();
  const [watchOnlyPrepared, setWatchOnlyPrepared] = useState(false);
  const [psbtReviewCompleted, setPsbtReviewCompleted] = useState(false);
  const [psbtForwardingPrepared, setPsbtForwardingPrepared] = useState(false);
  const detector = useMemo(() => new UniversalQrService(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraDetectorRef = useRef<BarcodeDetectorLike | null>(null);
  const cameraAnimationRef = useRef<number | undefined>(undefined);

  const cameraSupportStatus = getCameraSupportStatus();
  const cameraSupportMessage = getCameraSupportMessage(cameraSupportStatus);

  const isInputEmpty = scannerInput.trim().length === 0;

  const stopCameraSession = useCallback(() => {
    if (cameraAnimationRef.current !== undefined) {
      window.cancelAnimationFrame(cameraAnimationRef.current);
      cameraAnimationRef.current = undefined;
    }

    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    cameraDetectorRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraScanning(false);
  }, []);

  const handleManualClear = () => {
    const snapshot = buildManualClearSnapshot(scannerInput);
    setScannerInput(snapshot.scannerInput);
    setDetected(snapshot.detected);
    setErrorMessage(snapshot.errorMessage);
    setAutoClearedSensitiveData(snapshot.autoClearedSensitiveData);
    setLastActionMessage(snapshot.lastActionMessage);
  };

  const handleSwitchToManual = () => {
    setInputMode('manual');
    setCameraStatusMessage(undefined);
  };

  const handleSwitchToCamera = () => {
    const nextMode = resolveRequestedInputMode('camera', cameraSupportStatus);
    setInputMode(nextMode);
    if (nextMode === 'manual') {
      setCameraStatusMessage(cameraSupportMessage);
      return;
    }
    setCameraStatusMessage('Aponte para um QR válido para preencher o fluxo automaticamente.');
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

  useEffect(() => {
    const nextMode = resolveRequestedInputMode(inputMode, cameraSupportStatus);
    if (nextMode !== inputMode) {
      setInputMode(nextMode);
      setCameraStatusMessage(cameraSupportMessage);
    }
  }, [cameraSupportMessage, cameraSupportStatus, inputMode, stopCameraSession]);

  useEffect(() => {
    if (inputMode !== 'camera') {
      stopCameraSession();
      return;
    }

    if (cameraSupportStatus !== 'supported') {
      stopCameraSession();
      setCameraStatusMessage(cameraSupportMessage);
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        const detectorCtor = (globalThis as CameraEnvironment).BarcodeDetector;
        if (!detectorCtor) {
          throw new Error('BarcodeDetectorUnavailable');
        }
        cameraDetectorRef.current = new detectorCtor({ formats: ['qr_code'] });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraScanning(true);
        setCameraStatusMessage('Câmera ativa. Procurando QR...');

        const scanLoop = async () => {
          if (cancelled || inputMode !== 'camera') return;
          const localDetector = cameraDetectorRef.current;
          const video = videoRef.current;
          if (!localDetector || !video) return;

          try {
            const codes = await localDetector.detect(video);
            const rawValue = codes[0]?.rawValue?.trim();
            if (rawValue) {
              setScannerInput(rawValue);
              setLastActionMessage('Payload recebido por câmera e enviado ao pipeline local.');
              setInputMode('manual');
              setCameraStatusMessage('Leitura concluída. Revise o resultado abaixo.');
              stopCameraSession();
              return;
            }
          } catch {
            // mantém loop ativo enquanto câmera estiver em execução
          }

          cameraAnimationRef.current = window.requestAnimationFrame(() => {
            void scanLoop();
          });
        };

        void scanLoop();
      } catch (error) {
        if (!cancelled) {
          stopCameraSession();
          setInputMode('manual');
          setCameraStatusMessage(toCameraStartErrorMessage(error));
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCameraSession();
    };
  }, [cameraSupportMessage, cameraSupportStatus, inputMode]);

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
  const psbtHandoff = buildPsbtHandoffSnapshot(psbtReview, psbtReviewCompleted);
  const psbtForwarding = buildPsbtForwardingSnapshot(
    psbtHandoff,
    psbtForwardingPrepared,
    psbtReview
  );

  useEffect(() => {
    setWatchOnlyPrepared(false);
  }, [detected?.raw, watchOnly.ready]);

  useEffect(() => {
    setPsbtReviewCompleted(false);
  }, [detected?.raw, psbtReview.ready]);

  useEffect(() => {
    setPsbtForwardingPrepared(false);
  }, [detected?.raw, psbtReview.ready, psbtReviewCompleted]);

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
        <div className="input-mode-row" role="group" aria-label="Modo de entrada">
          <button
            type="button"
            onClick={handleSwitchToManual}
            disabled={inputMode === 'manual'}
            aria-pressed={inputMode === 'manual'}
          >
            Entrada manual
          </button>
          <button
            type="button"
            onClick={handleSwitchToCamera}
            disabled={inputMode === 'camera'}
            aria-pressed={inputMode === 'camera'}
          >
            Escanear QR (câmera)
          </button>
        </div>
        {cameraStatusMessage ? <p className="camera-state">{cameraStatusMessage}</p> : null}
        {inputMode === 'camera' ? (
          <section className="camera-panel">
            <p className="camera-state">
              Estado da câmera: {cameraScanning ? 'ativa' : 'iniciando/aguardando'}
            </p>
            <video ref={videoRef} className="camera-preview" muted playsInline />
            <p className="camera-hint">
              Se não conseguir usar a câmera neste dispositivo, volte para a entrada manual.
            </p>
          </section>
        ) : null}
        <textarea
          id="payload-input"
          value={scannerInput}
          onChange={(event) => setScannerInput(event.target.value)}
          placeholder="Cole o payload lido do QR"
          rows={4}
          disabled={inputMode === 'camera'}
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
            <p className="psbt-next-step-title">Checkpoint local pós-revisão:</p>
            <p className="psbt-state">Estado: {psbtHandoff.statusLabel}</p>
            <p className="psbt-guidance">{psbtHandoff.guidance}</p>
            <p className="psbt-state">Checkpoint: {psbtHandoff.localCheckpointLabel}</p>
            <button type="button" onClick={() => setPsbtReviewCompleted(true)}>
              Marcar revisão PSBT como concluída (local)
            </button>
            <p className="psbt-next-step-title">Preparação local de encaminhamento:</p>
            <p className="psbt-state">Estado: {psbtForwarding.statusLabel}</p>
            <p className="psbt-guidance">{psbtForwarding.guidance}</p>
            <p className="psbt-state">Preparação: {psbtForwarding.localForwardingLabel}</p>
            <p className="psbt-state">
              Token local de referência: {psbtForwarding.forwardingToken ?? 'n/d'}
            </p>
            <button
              type="button"
              onClick={() => setPsbtForwardingPrepared(true)}
              disabled={!psbtForwarding.ready}
            >
              Preparar encaminhamento para assinador externo (simulação local)
            </button>
            <p className="psbt-next-step-title">Etapas do fluxo (separação explícita):</p>
            <ol>
              <li>
                Revisão local:{' '}
                {psbtHandoff.flowStages.localReview === 'done' ? 'concluída' : 'ativa'}
              </li>
              <li>
                Exportação futura:{' '}
                {psbtHandoff.flowStages.futureExport === 'ready' ? 'pronta' : 'pendente'}
              </li>
              <li>
                Encaminhamento local atual:{' '}
                {psbtForwarding.flowBridge.localForwardingPreparation === 'done'
                  ? 'concluído (simulado localmente)'
                  : psbtForwarding.flowBridge.localForwardingPreparation === 'available'
                    ? 'disponível'
                    : 'bloqueado'}
              </li>
              <li>Assinatura externa futura: pendente (não integrada nesta versão)</li>
              <li>Validação/finalização futura: pendente (não integrada nesta versão)</li>
            </ol>
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
