import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  dts: true,
  clean: true,
  // tsdown >=0.21 defaults fixedExtension to true (.mjs/.cjs); keep .js/.d.ts to match package.json exports
  fixedExtension: false,
  treeshake: true,
  target: 'es2020',
})
