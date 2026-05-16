import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { validationSchema } from './config/configuration';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './database/supabase/supabase.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Environment / Config ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // ── Infrastructure ──────────────────────────────────────────────────────
    LoggerModule,
    SupabaseModule,

    // ── Features ────────────────────────────────────────────────────────────
    HealthModule,
  ],
})
export class AppModule {}
