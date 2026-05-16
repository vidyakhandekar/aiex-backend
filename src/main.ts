import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Suppress default Nest logger; Winston takes over below
    bufferLogs: true,
  });

  // ── Logger ──────────────────────────────────────────────────────────────────
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = app.get(ConfigService);

  // ── API Versioning ──────────────────────────────────────────────────────────
  const apiVersion = config.get<string>('app.apiVersion', '1');
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  app.setGlobalPrefix(apiPrefix, {
    // Health endpoint is served at /health (no prefix)
    exclude: ['health'],
  });

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,          // auto-transform payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Exception Filter ─────────────────────────────────────────────────
  const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));

  // ── CORS ────────────────────────────────────────────────────────────────────
  const corsOrigins = config.get<string[]>('app.corsOrigins', ['http://localhost:5173']);
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Start ───────────────────────────────────────────────────────────────────
  const port = config.get<number>('app.port', 3000);
  await app.listen(port);

  const winstonNest = app.get(WINSTON_MODULE_NEST_PROVIDER);
  winstonNest.log(
    `🚀 Server running → http://localhost:${port}/${apiPrefix}/v${apiVersion}`,
    'Bootstrap',
  );
  winstonNest.log(`📋 Health check  → http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap();
