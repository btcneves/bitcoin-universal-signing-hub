#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/infra/usb/dist/hardware-validation"
DEFAULT_ISO="$ROOT_DIR/infra/usb/dist/bursh-secure-usb-amd64.iso"

TESTER="TBD"
MACHINE="TBD"
ISO_PATH="$DEFAULT_ISO"
BOOT_MODE="UEFI"
BURSH_DATA_MODE="without-bursh-data"
SCENARIO_ID="TBD"
EVIDENCE_TARBALL_PATH="TBD"
EXTRA_ARTIFACTS_PATH="TBD"

usage() {
  cat <<'USAGE'
Usage:
  ./infra/usb/scripts/init-hardware-validation-record.sh [options]

Options:
  --tester <name>
  --machine <name>
  --iso <path>
  --boot-mode <UEFI|Legacy|Other>
  --with-bursh-data
  --without-bursh-data
  --scenario-id <HW-UEFI-01|HW-UEFI-02|HW-ALT-01|HW-LEGACY-01>
  --evidence-tar <path>
  --artifacts-path <path>
  -h, --help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tester)
      TESTER="${2:-}"
      shift 2
      ;;
    --machine)
      MACHINE="${2:-}"
      shift 2
      ;;
    --iso)
      ISO_PATH="${2:-}"
      shift 2
      ;;
    --boot-mode)
      BOOT_MODE="${2:-}"
      shift 2
      ;;
    --with-bursh-data)
      BURSH_DATA_MODE="with-bursh-data"
      shift
      ;;
    --without-bursh-data)
      BURSH_DATA_MODE="without-bursh-data"
      shift
      ;;
    --scenario-id)
      SCENARIO_ID="${2:-}"
      shift 2
      ;;
    --evidence-tar)
      EVIDENCE_TARBALL_PATH="${2:-}"
      shift 2
      ;;
    --artifacts-path)
      EXTRA_ARTIFACTS_PATH="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[secure-usb] unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

mkdir -p "$OUTPUT_DIR"

DATE_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RUN_ID="hw-$(date -u +%Y%m%dT%H%M%SZ)-$(openssl rand -hex 2)"
SAFE_MACHINE="$(tr '[:upper:]' '[:lower:]' <<<"$MACHINE" | tr -cs 'a-z0-9._-' '-')"
[[ -z "$SAFE_MACHINE" ]] && SAFE_MACHINE="machine"
OUTPUT_FILE="$OUTPUT_DIR/${RUN_ID}-${SAFE_MACHINE}.md"

cat > "$OUTPUT_FILE" <<EOF_RECORD
# Secure USB Hardware Validation Record

- Run ID: $RUN_ID
- Date UTC: $DATE_UTC
- Tester: $TESTER
- Machine: $MACHINE
- ISO: $ISO_PATH
- Boot mode: $BOOT_MODE
- BURSH-DATA scenario: $BURSH_DATA_MODE
- Matrix scenario ID: $SCENARIO_ID

## Checklist results (PASS / FAIL / BLOCKED)

| Item | Result | Evidence/notes |
|---|---|---|
| Checksum (sha256sum -c sha256sums.txt) | TBD | |
| Boot via USB | TBD | |
| Autologin | TBD | |
| Kiosk | TBD | |
| App local (127.0.0.1:4173) | TBD | |
| Smoke test (smoke-test-bursh-live.sh) | TBD | |
| BURSH-DATA policy (optional by scenario) | TBD | |
| Evidence collection (collect-bursh-boot-evidence.sh) | TBD | |

## Final result

- Final status: TBD (PASS | FAIL | BLOCKED)
- Evidence tar.gz path: $EVIDENCE_TARBALL_PATH
- Extra artifacts path (optional): $EXTRA_ARTIFACTS_PATH

## Issues / observations

- TBD

## Next action

- TBD
EOF_RECORD

echo "[secure-usb] validation record created: $OUTPUT_FILE"
