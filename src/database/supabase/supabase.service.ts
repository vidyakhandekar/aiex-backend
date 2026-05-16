import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.client = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        realtime: {
          transport: ws,
        },
      },
    );

    console.log('✅ Supabase connected');
  }

  getClient() {
    return this.client;
  }
}