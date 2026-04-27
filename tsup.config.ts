import { defineConfig } from 'tsup';

export default defineConfig({
  // The entry points for our CLI commands
  entry: ['src/index.ts'],
  
  // Single-file bundling
  bundle: true,
  
  // Output CommonJS (which pkg/node expects)
  format: ['cjs'],
  
  // Clean the dist directory before each build
  clean: true,
  
  // Minify the output for a smaller binary footprint
  minify: true,
  
  // Avoid bundling Node builtins like fs, path
  // but bundle all node_modules into the file
  noExternal: [/(.*)/],
  
  // Target modern Node
  target: 'node20',
});
