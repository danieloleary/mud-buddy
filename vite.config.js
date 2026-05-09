import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'copy-public-sample-csv',
      closeBundle() {
        mkdirSync(resolve('dist/examples'), { recursive: true });
        copyFileSync(resolve('examples/sample-ebmud-usage.csv'), resolve('dist/examples/sample-ebmud-usage.csv'));
      }
    }
  ]
});
