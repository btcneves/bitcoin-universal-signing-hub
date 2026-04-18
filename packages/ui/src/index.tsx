import type { PropsWithChildren } from 'react';

export function ActionCard(props: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <h3>{props.title}</h3>
      <p>{props.subtitle}</p>
      {props.children}
    </section>
  );
}
