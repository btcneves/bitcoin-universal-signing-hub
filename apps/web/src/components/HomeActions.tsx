import { ActionCard } from '@bursh/ui';

const ACTIONS = [
  { title: 'Escanear QR', subtitle: 'Detecta seed/xpub/PSBT/lightning automaticamente.' },
  { title: 'Abrir carteira', subtitle: 'Importe watch-only por xpub/ypub/zpub.' },
  { title: 'Criar transação', subtitle: 'Monte PSBT para assinatura externa.' },
  { title: 'Configurações', subtitle: 'Offline-first, privacidade e preferências.' }
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
