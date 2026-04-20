import { ActionCard } from '@bursh/ui';

const ACTIONS = [
  { title: 'Verificar Seed BIP39', subtitle: 'Entrada manual ou QR com validação RAM-only.' },
  {
    title: 'Gerar Xpub via QR',
    subtitle: 'Exportação watch-only em UR (`ur:crypto-hdkey/...`) sem USB/rede.'
  },
  {
    title: 'Assinar PSBT via QR offline',
    subtitle: 'Roundtrip air-gapped de PSBT (`ur:crypto-psbt/...`) com assinatura em memória.'
  },
  {
    title: 'Escanear QR',
    subtitle: 'Detector em memória transitória para seed, passphrase, xpub e PSBT.'
  },
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
