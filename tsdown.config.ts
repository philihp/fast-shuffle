import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  // engines.node is >=14, so later syntax is lowered for it
  target: 'node14',
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
})
