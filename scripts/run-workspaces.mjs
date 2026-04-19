#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/run-workspaces.mjs <script>');
  process.exit(1);
}

const execPath = process.env.npm_execpath ?? '';
const isPnpm = execPath.includes('pnpm');

const command = isPnpm ? 'pnpm' : 'npm';
const args = isPnpm
  ? ['-r', '--if-present', 'run', target]
  : ['run', target, '--workspaces', '--if-present'];

console.log(`[run-workspaces] ${command} ${args.join(' ')}`);

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error(`[run-workspaces] failed to spawn ${command}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
