import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@radix-ui/react-*', 'lucide-react'],
  esbuildOptions: (options) => {
    options.jsx = 'automatic';
  },
  treeshake: true,
  splitting: true,
  outDir: 'dist',
  sourcemap: true,
  loader: {
    '.css': 'css',
  },
});
