import { Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase/supabase.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createTenantDto: CreateTenantDto) {
    const client = this.supabaseService.getClient();

    const { data: existing } = await client
      .from('tenants')
      .select('id')
      .eq('slug', createTenantDto.slug)
      .single();

    if (existing) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    const { data, error } = await client
      .from('tenants')
      .insert([createTenantDto])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async findAll() {
    const client = this.supabaseService.getClient();
    const { data, error } = await client.from('tenants').select('*');

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async findOne(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Tenant not found');
    }

    return data;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const client = this.supabaseService.getClient();
    
    // Check if exists
    await this.findOne(id);

    const { data, error } = await client
      .from('tenants')
      .update(updateTenantDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
