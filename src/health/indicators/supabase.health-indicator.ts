import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { SupabaseService } from '../../database/supabase/supabase.service';

@Injectable()
export class SupabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly supabaseService: SupabaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Lightweight connectivity check — fetches zero rows from any table
      const client = this.supabaseService.getClient();
      const { error } = await client.from('_health_check').select('*').limit(0);

      // A "relation does not exist" error still means the DB is reachable
      const isReachable =
        !error || error.code === '42P01' || error.message.includes('does not exist');

      if (isReachable) {
        return this.getStatus(key, true);
      }

      throw new HealthCheckError(
        'Supabase health check failed',
        this.getStatus(key, false, { message: error?.message }),
      );
    } catch (err) {
      if (err instanceof HealthCheckError) throw err;

      throw new HealthCheckError(
        'Supabase unreachable',
        this.getStatus(key, false, {
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  }
}
