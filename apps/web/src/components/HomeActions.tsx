import { ActionCard } from '@bursh/ui';

const ACTIONS = [
  { title: 'Escanear QR', subtitle: 'Detector em memória transitória com limpeza manual.' },
  { title: 'Fluxo watch-only', subtitle: 'Importação por xpub/ypub/zpub (sem seed/passphrase).' },
  { title: 'Fluxo sensível', subtitle: 'PSBT e seed em RAM-only, sem persistência local.' },
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
