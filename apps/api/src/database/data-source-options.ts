import { DataSourceOptions } from 'typeorm';
import { entities } from './entities.js';
import { SnakeNamingStrategy } from './snake-naming.strategy.js';

export interface PostgresConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

// Deliberately does NOT include a `migrations` entry: the running app never
// calls dataSource.runMigrations() (migrationsRun stays false), so pointing
// it at the migration files would be dead configuration — and worse, TypeORM
// eagerly `import()`s every matched migration file during DataSource
// initialization to build metadata, even when they're never going to run.
// Under plain Node ESM (no ts-node loader) that raw import of a .ts file
// mishandles interfaces like `MigrationInterface` that are imported as
// values but exist only as types, breaking app boot and Vitest e2e runs
// alike. The CLI data source (data-source.ts) is the only thing that
// actually needs to know where migration files live, and it always runs
// through the `typeorm-ts-node-esm` wrapper, which transpiles them properly.
//
// Takes the connection config as a plain argument (rather than reading
// process.env itself) so this stays a pure function usable from both the
// Nest app (values sourced via ConfigService) and the standalone CLI data
// source (values sourced via `dotenv/config` + raw process.env).
export function createDataSourceOptions(config: PostgresConnectionConfig): DataSourceOptions {
  return {
    type: 'postgres',
    ...config,
    namingStrategy: new SnakeNamingStrategy(),
    entities,
    synchronize: false,
    migrationsRun: false,
  };
}
