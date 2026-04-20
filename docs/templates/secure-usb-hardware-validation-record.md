# Secure USB Hardware Validation Record

- Run ID: `{{RUN_ID}}`
- Date UTC: `{{DATE_UTC}}`
- Tester: `{{TESTER}}`
- Machine: `{{MACHINE}}`
- ISO: `{{ISO_PATH}}`
- Boot mode: `{{BOOT_MODE}}`
- BURSH-DATA scenario: `{{BURSH_DATA_MODE}}`
- Matrix scenario ID: `{{SCENARIO_ID}}` (`HW-UEFI-01` | `HW-UEFI-02` | `HW-ALT-01` | `HW-LEGACY-01`)

## Checklist results (PASS / FAIL / BLOCKED)

| Item                                                   | Result | Evidence/notes |
| ------------------------------------------------------ | ------ | -------------- |
| Checksum (`sha256sum -c sha256sums.txt`)               | `TBD`  |                |
| Boot via USB                                           | `TBD`  |                |
| Autologin                                              | `TBD`  |                |
| Kiosk                                                  | `TBD`  |                |
| App local (`127.0.0.1:4173`)                           | `TBD`  |                |
| Smoke test (`smoke-test-bursh-live.sh`)                | `TBD`  |                |
| QR handoff xpub (`generate` + `scan --expect xpub`)    | `TBD`  |                |
| QR handoff PSBT (`generate` + `scan --expect psbt`)    | `TBD`  |                |
| BURSH-DATA policy (optional by scenario)               | `TBD`  |                |
| Evidence collection (`collect-bursh-boot-evidence.sh`) | `TBD`  |                |

## Final result

- Final status: `TBD` (`PASS` | `FAIL` | `BLOCKED`)
- Evidence tar.gz path: `{{EVIDENCE_TARBALL_PATH}}`
- Extra artifacts path (optional): `{{EXTRA_ARTIFACTS_PATH}}`

## Issues / observations

- `TBD`

## Next action

- `TBD`
