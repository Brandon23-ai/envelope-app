import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validate } from './config/env.validation.js';
import { createDataSourceOptions } from './database/data-source-options.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createDataSourceOptions({
          host: configService.get<string>('DB_HOST') ?? 'localhost',
          port: Number(configService.get<string>('DB_PORT') ?? 5432),
          username: configService.get<string>('DB_USERNAME') ?? 'postgres',
          password: configService.get<string>('DB_PASSWORD') ?? '',
          database: configService.get<string>('DB_NAME') ?? 'envelope_nest',
        }),
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
