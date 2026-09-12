import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    // Resolves the path aliases declared in tsconfig.json, including the ones
    // added by `nest g library`.
    tsconfigPaths(),
    // esbuild (Vite/Vitest's default TS transform) doesn't emit
    // `emitDecoratorMetadata` output, which Nest's DI/ValidationPipe rely on
    // to reflect parameter types — see vitest.config.e2e.ts for the full note.
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
