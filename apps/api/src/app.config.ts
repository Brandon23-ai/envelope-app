import { INestApplication, ValidationPipe } from '@nestjs/common';

// Shared between main.ts and the e2e test setup: creating an INestApplication
// straight from a TestingModule (as the e2e specs do) bypasses main.ts's
// bootstrap() entirely, so any global pipe/filter registered only there would
// silently not apply under test.
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
}
