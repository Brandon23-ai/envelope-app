import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';
import { validate } from '../src/config/env.validation.js';
import { UsersModule } from '../src/users/users.module.js';
import { AuthModule } from '../src/auth/auth.module.js';
import { createTestingDataSourceOptions } from './typeorm-test.config.js';

// Mirrors AppModule, but with a `TypeOrmModule.forRoot(...)` pointed at an
// isolated in-memory DB instead of `forRootAsync`. `Test.createTestingModule
// (...).overrideModule(TypeOrmModule).useModule(...)` looks like the natural
// way to swap this in on top of the real AppModule, but Nest's override
// matches by strict reference equality against the raw import entry — and
// `TypeOrmModule.forRootAsync(...)` produces a dynamic-module object, not the
// bare `TypeOrmModule` class, so that override silently never matches.
// Composing a dedicated module here sidesteps that entirely.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRoot(createTestingDataSourceOptions()),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class TestAppModule {}
