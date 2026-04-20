#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEFAULT_INPUT_DIR="$ROOT_DIR/infra/usb/dist/hardware-validation"
DEFAULT_OUTPUT_FILE="$ROOT_DIR/infra/usb/dist/hardware-validation/summary.md"

usage() {
  cat <<'USAGE'
Usage:
  ./infra/usb/scripts/summarize-hardware-validation.sh [options]

Options:
  --input-dir <path>    Directory with hardware validation records (.md)
  --output <path>       Output markdown report file (default: infra/usb/dist/hardware-validation/summary.md)
  --stdout-only         Print report only to stdout (do not write file)
  -h, --help
USAGE
}

INPUT_DIR="$DEFAULT_INPUT_DIR"
OUTPUT_FILE="$DEFAULT_OUTPUT_FILE"
STDOUT_ONLY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input-dir)
      INPUT_DIR="${2:-}"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --stdout-only)
      STDOUT_ONLY="true"
      shift
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

python3 - "$INPUT_DIR" "$OUTPUT_FILE" "$STDOUT_ONLY" <<'PY'
import datetime as dt
import pathlib
import re
import sys

input_dir = pathlib.Path(sys.argv[1])
output_file = pathlib.Path(sys.argv[2])
stdout_only = sys.argv[3].lower() == "true"

required_scenarios = ["HW-UEFI-01", "HW-UEFI-02", "HW-ALT-01"]
scenario_descriptions = {
    "HW-UEFI-01": "UEFI sem BURSH-DATA (máquina física A)",
    "HW-UEFI-02": "UEFI com BURSH-DATA (máquina física A ou B)",
    "HW-ALT-01": "UEFI sem BURSH-DATA em hardware alternativo (vendor/chipset diferente)",
    "HW-LEGACY-01": "Legacy/BIOS sem BURSH-DATA (condicional se houver alvo Legacy)",
}
mandatory_items = {
    "checksum (sha256sum -c sha256sums.txt)",
    "boot via usb",
    "autologin",
    "kiosk",
    "app local (127.0.0.1:4173)",
    "smoke test (smoke-test-bursh-live.sh)",
    "evidence collection (collect-bursh-boot-evidence.sh)",
}

if not input_dir.exists():
    files = []
else:
    files = sorted(p for p in input_dir.glob("*.md") if p.name.lower() != "summary.md")

status_counts = {"PASS": 0, "FAIL": 0, "BLOCKED": 0, "UNKNOWN": 0}
checklist_counts = {"PASS": 0, "FAIL": 0, "BLOCKED": 0}
coverage = {key: [] for key in scenario_descriptions}
runs = []

field_patterns = {
    "run_id": re.compile(r"^-\s*Run ID:\s*(.+)$", re.IGNORECASE),
    "date_utc": re.compile(r"^-\s*Date UTC:\s*(.+)$", re.IGNORECASE),
    "machine": re.compile(r"^-\s*Machine:\s*(.+)$", re.IGNORECASE),
    "boot_mode": re.compile(r"^-\s*Boot mode:\s*(.+)$", re.IGNORECASE),
    "bursh_data": re.compile(r"^-\s*BURSH-DATA scenario:\s*(.+)$", re.IGNORECASE),
    "scenario_id": re.compile(r"^-\s*Matrix scenario ID:\s*(.+)$", re.IGNORECASE),
    "final_status": re.compile(r"^-\s*Final status:\s*([A-Za-z]+)", re.IGNORECASE),
    "evidence": re.compile(r"^-\s*Evidence tar\.gz path:\s*(.+)$", re.IGNORECASE),
}

row_re = re.compile(r"^\|\s*(.*?)\s*\|\s*`?([A-Za-z]+|TBD)`?\s*\|", re.IGNORECASE)

for path in files:
    text = path.read_text(encoding="utf-8", errors="ignore")
    data = {
        "path": path,
        "run_id": path.stem,
        "date_utc": "",
        "machine": "",
        "boot_mode": "",
        "bursh_data": "",
        "scenario_id": "",
        "final_status": "UNKNOWN",
        "evidence": "",
        "mandatory_fail": [],
        "mandatory_blocked": [],
    }

    for raw_line in text.splitlines():
        line = raw_line.strip()
        for key, pattern in field_patterns.items():
            m = pattern.match(line)
            if not m:
                continue
            value = m.group(1).strip().strip("`")
            if key == "final_status":
                value = value.upper()
                if value not in {"PASS", "FAIL", "BLOCKED"}:
                    value = "UNKNOWN"
            data[key] = value

        m_row = row_re.match(line)
        if m_row:
            item = m_row.group(1).strip().lower()
            item_status = m_row.group(2).strip().upper()
            if item_status in checklist_counts:
                checklist_counts[item_status] += 1
            if item in mandatory_items and item_status == "FAIL":
                data["mandatory_fail"].append(m_row.group(1).strip())
            if item in mandatory_items and item_status == "BLOCKED":
                data["mandatory_blocked"].append(m_row.group(1).strip())

    status_counts[data["final_status"] if data["final_status"] in status_counts else "UNKNOWN"] += 1

    scenario_ids = []
    if data["scenario_id"]:
        scenario_ids = [s.strip().upper() for s in re.split(r"[,;\s]+", data["scenario_id"]) if s.strip()]
    else:
        mode = data["boot_mode"].upper()
        bursh = data["bursh_data"].lower()
        if mode == "UEFI" and "with-bursh-data" in bursh:
            scenario_ids = ["HW-UEFI-02"]
        elif mode == "UEFI" and "without-bursh-data" in bursh:
            scenario_ids = ["HW-UEFI-01"]
        elif mode in {"LEGACY", "BIOS/LEGACY", "BIOS"}:
            scenario_ids = ["HW-LEGACY-01"]

    for sid in scenario_ids:
        if sid in coverage:
            coverage[sid].append(data)

    runs.append(data)

# evaluate gaps
coverage_gaps = []
for sid in required_scenarios:
    if not any(r["final_status"] == "PASS" for r in coverage[sid]):
        coverage_gaps.append(f"{sid} sem execução PASS")

run_quality_gaps = []
for run in runs:
    if run["final_status"] != "PASS":
        continue
    if not run["evidence"] or run["evidence"].upper().startswith("TBD"):
        run_quality_gaps.append(f"{run['run_id']}: sem caminho de evidência (.tar.gz)")
    if run["mandatory_fail"]:
        run_quality_gaps.append(f"{run['run_id']}: FAIL em item obrigatório ({', '.join(run['mandatory_fail'])})")
    if run["mandatory_blocked"]:
        run_quality_gaps.append(f"{run['run_id']}: BLOCKED em item obrigatório ({', '.join(run['mandatory_blocked'])})")

has_gate = not coverage_gaps and not run_quality_gaps

lines = []
lines.append("# Secure USB Hardware Validation — Acceptance Summary")
lines.append("")
lines.append(f"- Generated at (UTC): `{dt.datetime.utcnow().replace(microsecond=0).isoformat()}Z`")
lines.append(f"- Input directory: `{input_dir}`")
lines.append(f"- Total runs found: **{len(runs)}**")
lines.append("")
lines.append("## Aggregated status")
lines.append("")
lines.append(f"- Final status counts: PASS **{status_counts['PASS']}**, FAIL **{status_counts['FAIL']}**, BLOCKED **{status_counts['BLOCKED']}**, UNKNOWN **{status_counts['UNKNOWN']}**.")
lines.append(f"- Checklist item counts (all parsed rows): PASS **{checklist_counts['PASS']}**, FAIL **{checklist_counts['FAIL']}**, BLOCKED **{checklist_counts['BLOCKED']}**.")
lines.append("")
lines.append("## Mandatory matrix coverage")
lines.append("")
lines.append("| Scenario | Description | Coverage |")
lines.append("|---|---|---|")
for sid in required_scenarios:
    pass_runs = [r["run_id"] for r in coverage[sid] if r["final_status"] == "PASS"]
    if pass_runs:
        coverage_str = "PASS via " + ", ".join(f"`{rid}`" for rid in pass_runs)
    elif coverage[sid]:
        coverage_str = "Executado sem PASS"
    else:
        coverage_str = "Sem execução"
    lines.append(f"| {sid} | {scenario_descriptions[sid]} | {coverage_str} |")
lines.append("")
lines.append("## Gate result (aceite mínimo)")
lines.append("")
lines.append(f"- Result: **{'GO' if has_gate else 'NO-GO'}**")
if has_gate:
    lines.append("- Todos os cenários obrigatórios possuem execução PASS com evidência e sem falhas/bloqueios em itens obrigatórios.")
else:
    lines.append("- Gaps que impedem aceite mínimo:")
    for gap in coverage_gaps + run_quality_gaps:
        lines.append(f"  - {gap}")
lines.append("")
lines.append("## Run inventory")
lines.append("")
if not runs:
    lines.append("- Nenhum registro encontrado.")
else:
    lines.append("| Run ID | Date UTC | Machine | Scenario | Final | Evidence |")
    lines.append("|---|---|---|---|---|---|")
    for run in runs:
        sid = run["scenario_id"] or "(inferido/ausente)"
        ev = run["evidence"] if run["evidence"] else "TBD"
        lines.append(f"| {run['run_id']} | {run['date_utc'] or '-'} | {run['machine'] or '-'} | {sid} | {run['final_status']} | {ev} |")

report = "\n".join(lines) + "\n"

if not stdout_only:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(report, encoding="utf-8")
    print(f"[secure-usb] summary written: {output_file}")

print(report)
PY
