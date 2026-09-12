import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDataSourceOptions } from '../src/database/data-source-options.js';

// Same Postgres server as the app (config via the same DB_HOST/PORT/USERNAME/
// PASSWORD env vars, loaded from .env by test/setup-env.ts), but a dedicated
// database — DB_NAME_TEST, not DB_NAME — since this uses dropSchema:true and
// must never point at the real dev database.
export function createTestingDataSourceOptions(): TypeOrmModuleOptions {
  return {
    ...createDataSourceOptions({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME_TEST ?? 'envelope_nest_test',
    }),
    synchronize: true,
    dropSchema: true,
    // Nest's TypeOrmModule retries a failed connection 10x with a 3s delay
    // by default — a good resilience default for a real app waiting on a
    // cold-booting DB, but pure noise in tests: it just turns a real error
    // into a ~30s hang before the actual failure ever surfaces.
    retryAttempts: 0,
  };
}
