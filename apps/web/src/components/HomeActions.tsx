import { ActionCard } from '@bursh/ui';

const ACTIONS = [
  { title: 'Escanear QR', subtitle: 'Detector em memória transitória com limpeza manual.' },
  {
    title: 'Verificação BIP39',
    subtitle: 'Seed/passphrase em RAM-only para conferir xpub, derivação e endereços.'
  },
  {
    title: 'Fluxo watch-only',
    subtitle: 'Geração/importação de xpub via QR, sem seed/passphrase no dispositivo online.'
  },
  { title: 'Fluxo sensível', subtitle: 'Assinatura PSBT offline em memória e exportação por QR.' },
  { title: 'Configurações', subtitle: 'Privacidade, hardening e políticas de dados.' }
];

export function HomeActions() {
  return (
    <>
      {ACTIONS.map((action) => (
        <ActionCard key={action.title} title={action.title} subtitle={action.subtitle} />
      ))}
    </>
  );
}
