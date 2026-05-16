import { Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase/supabase.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { InviteTenantAdminDto } from './dto/invite-tenant-admin.dto';

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

  async inviteTenantAdmin(tenantId: string, inviteDto: InviteTenantAdminDto) {
    const client = this.supabaseService.getClient();

    // 1. Verify tenant exists
    await this.findOne(tenantId);

    // 2. Invite user via Supabase Auth
    const { data: authData, error: authError } = await client.auth.admin.inviteUserByEmail(inviteDto.email, {
      data: {
        full_name: inviteDto.full_name,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw new InternalServerErrorException(`Failed to invite admin: ${authError.message}`);
    }

    const userId = authData.user.id;

    // 3. Link user to the tenant as 'tenant_admin'
    const { error: memberError } = await client
      .from('tenant_members')
      .insert([
        {
          tenant_id: tenantId,
          user_id: userId,
          role: 'tenant_admin',
        },
      ]);

    if (memberError) {
      throw new InternalServerErrorException(`User invited, but failed to link to tenant: ${memberError.message}`);
    }

    return {
      message: 'Tenant admin invited successfully',
      user_id: userId,
      email: inviteDto.email,
      role: 'tenant_admin',
    };
  }
}
