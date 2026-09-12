import 'dotenv/config';

// Loads DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD from the real .env so tests
// can reach the same Postgres server as the app — see DB_NAME_TEST in
// typeorm-test.config.ts for how the actual test database stays separate.
process.env.JWT_ACCESS_SECRET = 'test-secret';
