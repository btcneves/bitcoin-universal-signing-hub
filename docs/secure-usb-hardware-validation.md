# Secure USB Edition — Hardware Validation (aceite mínimo)

Objetivo: transformar testes físicos em **aceite profissional mínimo**, com critérios claros e evidência consolidável.

## 1) Checklist formal de validação em hardware real

Status permitido por item:

- `PASS`: critério atendido sem ressalva.
- `FAIL`: critério não atendido.
- `BLOCKED`: não executável por causa externa (ex.: firmware da máquina sem opção Legacy, porta USB defeituosa, energia instável).

> Regra de aceite mínimo: execução só é aceita se **todos os itens obrigatórios** estiverem `PASS` e sem `BLOCKED` nos obrigatórios.

### Checklist (execução única)

| Item                  | Obrigatório                                           | Critério objetivo                               | PASS                                     | FAIL                                   | BLOCKED                                       |
| --------------------- | ----------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- | -------------------------------------- | --------------------------------------------- |
| Boot via USB          | Sim                                                   | Sistema live inicializa via pendrive BURSH      | Inicializa no desktop live               | Não inicializa/trava/reboot loop       | Firmware/ambiente impede boot USB             |
| Autologin             | Sim                                                   | Sessão abre sem credencial manual               | Usuário `bursh` entra automaticamente    | Solicita login manual                  | Bloqueio externo de política local/firmaware  |
| Kiosk                 | Sim                                                   | Chromium abre fullscreen automático             | Janela kiosk abre e permanece estável    | Não abre, fecha ou sai do fullscreen   | GPU/driver impede renderização                |
| App local             | Sim                                                   | `http://127.0.0.1:4173` responde localmente     | Página carrega sem erro crítico          | Não responde ou erro fatal de app      | Rede local/sistema inconsistente impede teste |
| Smoke test            | Sim                                                   | `smoke-test-bursh-live.sh` retorna sucesso      | Exit code 0                              | Exit code != 0                         | Script ausente/corrompido no live             |
| BURSH-DATA (opcional) | Não (obrigatório só quando cenário inclui BURSH-DATA) | Persistência apenas em watch-only/config        | `/mnt/bursh-data` e bind mounts corretos | Montagem/persistência fora da política | Cenário sem BURSH-DATA ou mídia defeituosa    |
| Coleta de evidência   | Sim                                                   | `collect-bursh-boot-evidence.sh` gera `.tar.gz` | Tarball criado e caminho registrado      | Não gera tarball                       | Partição/diretório destino indisponível       |

## 2) Matriz mínima de testes de hardware

Matriz curta para aceite mínimo (sem burocracia):

| ID           | Boot mode                  | BURSH-DATA | Tipo de hardware                                    | Obrigatório para aceite mínimo |
| ------------ | -------------------------- | ---------- | --------------------------------------------------- | ------------------------------ |
| HW-UEFI-01   | UEFI                       | Não        | Máquina física A                                    | Sim                            |
| HW-UEFI-02   | UEFI                       | Sim        | Máquina física A ou B                               | Sim                            |
| HW-ALT-01    | UEFI                       | Não        | Máquina física diferente (chipset/vendor diferente) | Sim                            |
| HW-LEGACY-01 | BIOS/Legacy (se aplicável) | Não        | Máquina com Legacy disponível                       | Condicional\*                  |

\* Condicional: executar apenas se existir hardware alvo com opção Legacy real no escopo do time.

### Gate de aceite mínimo (release funcional da fundação)

Aceite mínimo atingido quando:

1. `HW-UEFI-01`, `HW-UEFI-02` e `HW-ALT-01` estão `PASS`.
2. Cada execução obrigatória possui registro de execução preenchido.
3. Cada execução obrigatória possui caminho de `.tar.gz` de evidências.
4. Não existe `FAIL` aberto em item obrigatório.

## 3) Formato padronizado de evidência

Template oficial: `docs/templates/secure-usb-hardware-validation-record.md`.

Campos obrigatórios no registro:

- data/hora UTC;
- máquina e testador;
- ISO usada;
- modo de boot;
- ID do cenário da matriz (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01` ou `HW-LEGACY-01`);
- resultado por item (PASS/FAIL/BLOCKED);
- resultado final;
- caminho do `.tar.gz` de evidências;
- observações/falhas e próxima ação.

### Geração rápida do registro-base

Script auxiliar (host):

```bash
./infra/usb/scripts/init-hardware-validation-record.sh \
  --tester "nome" \
  --machine "maquina-a" \
  --iso "infra/usb/dist/bursh-secure-usb-amd64.iso" \
  --boot-mode "UEFI" \
  --scenario-id "HW-UEFI-02" \
  --with-bursh-data
```

Saída: arquivo `.md` em `infra/usb/dist/hardware-validation/` pronto para completar durante/após o teste físico.

## 4) Consolidação operacional de aceite mínimo

Script oficial de agregação:

```bash
./infra/usb/scripts/summarize-hardware-validation.sh
```

Saídas:

- relatório em `infra/usb/dist/hardware-validation/summary.md`;
- mesmo conteúdo também impresso no terminal.

O resumo agregado mostra:

- total de execuções;
- contagem de `PASS/FAIL/BLOCKED` (resultado final e itens de checklist);
- cobertura dos cenários obrigatórios (`HW-UEFI-01`, `HW-UEFI-02`, `HW-ALT-01`);
- `GO` ou `NO-GO` do gate mínimo;
- gaps objetivos que ainda bloqueiam o aceite mínimo.

Modo alternativo (sem escrever arquivo):

```bash
./infra/usb/scripts/summarize-hardware-validation.sh --stdout-only
```

## 5) Complemento de validação mínima do fluxo QR offline

Adicionar ao registro da rodada física:

1. gerar QR de xpub (`--type xpub`) e escanear com `--expect xpub`;
2. gerar QR de PSBT (`--type psbt`) e escanear com `--expect psbt`;
3. confirmar que não houve transferência por rede/pendrive para payloads sensíveis.

Critério: os dois handoffs QR precisam ser `PASS` para declarar fluxo air-gapped funcional na rodada.
