import { defineConfig } from 'vite';
import type { PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

const reactPlugin = react() as unknown as PluginOption;

export default defineConfig({
  plugins: [reactPlugin]
});
