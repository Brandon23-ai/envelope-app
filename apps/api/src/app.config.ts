import { INestApplication, ValidationPipe } from '@nestjs/common';

// Shared between main.ts and the e2e test setup: creating an INestApplication
// straight from a TestingModule (as the e2e specs do) bypasses main.ts's
// bootstrap() entirely, so any global pipe/filter registered only there would
// silently not apply under test.
export function configureApp(app: INestApplication): void {
  // Only native/Expo Go clients were expected to call this API, which don't
  // enforce CORS at all. The Expo web target does (it's a real browser), so
  // this is needed for the browser-based dev preview to reach the API.
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
}
