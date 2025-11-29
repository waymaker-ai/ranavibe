import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  external: ['react', 'react-dom'],
  splitting: false,
  sourcemap: true,
  clean: true,
});
