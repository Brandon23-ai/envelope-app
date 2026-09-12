import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  // esbuild (Vite/Vitest's default TS transform) doesn't emit
  // `emitDecoratorMetadata` output — Nest's ValidationPipe and DI rely on
  // that to reflect constructor/method parameter types. Without SWC here,
  // DTO validation silently no-ops under Vitest even though the identical
  // code validates correctly via a real `tsc` build.
  plugins: [
    tsconfigPaths(),
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
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup-env.ts'],
    // All e2e spec files share one real Postgres database (envelope_nest_test)
    // and each one's beforeEach does dropSchema+synchronize. Vitest runs
    // separate test files in parallel by default, so two files racing to
    // recreate the same tables at once corrupts Postgres's own catalog
    // (duplicate key on pg_class_relname_nsp_index). Sequential file
    // execution avoids the race; it doesn't affect the (already-sequential)
    // ordering of tests within a single file.
    fileParallelism: false,
  },
});
