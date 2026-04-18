#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_major=20
node_major="$(node -p "process.versions.node.split('.')[0]")"
if (( node_major < required_major )); then
  echo "Node >=20 é obrigatório. Atual: $(node -v)" >&2
  exit 1
fi

export HUSKY=0

npm install --workspaces
npm run build
npm run lint
npm run test
