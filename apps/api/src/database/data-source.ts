import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './data-source-options.js';

const migrationsDir = path.dirname(fileURLToPath(import.meta.url));

export default new DataSource({
  ...createDataSourceOptions({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'envelope_nest',
  }),
  migrations: [path.join(migrationsDir, 'migrations', '*.{js,ts}')],
});
