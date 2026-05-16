import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SupabaseModule } from '../database/supabase/supabase.module';
import { SupabaseHealthIndicator } from './indicators/supabase.health-indicator';

@Module({
  imports: [
    TerminusModule,
    ConfigModule,
    SupabaseModule,
  ],
  controllers: [HealthController],
  providers: [SupabaseHealthIndicator],
})
export class HealthModule {}
