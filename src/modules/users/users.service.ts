import { Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase/supabase.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async inviteUser(tenantId: string, inviteUserDto: InviteUserDto) {
    const client = this.supabaseService.getClient();

    // 1. Invite the user via Supabase Auth
    // This will create a row in auth.users and trigger the Postgres function to create a row in public.users
    const { data: authData, error: authError } = await client.auth.admin.inviteUserByEmail(inviteUserDto.email, {
      data: {
        full_name: inviteUserDto.full_name,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw new InternalServerErrorException(`Failed to invite user: ${authError.message}`);
    }

    const userId = authData.user.id;

    // 2. Link the user to the current tenant in tenant_members
    const role = inviteUserDto.role || 'student';
    
    // We add a small delay or retry logic if needed because the trigger runs asynchronously,
    // but the foreign key in tenant_members references users(id). 
    // Usually, the trigger executes in the same transaction for Supabase Postgres, so it's instantaneous.
    const { error: memberError } = await client
      .from('tenant_members')
      .insert([
        {
          tenant_id: tenantId,
          user_id: userId,
          role: role,
        },
      ]);

    if (memberError) {
      // If adding to tenant fails, we might want to log it or handle cleanup.
      throw new InternalServerErrorException(`User invited, but failed to link to tenant: ${memberError.message}`);
    }

    return {
      message: 'User invited successfully',
      user_id: userId,
      email: inviteUserDto.email,
      role: role,
    };
  }

  async findAllInTenant(tenantId: string) {
    const client = this.supabaseService.getClient();
    
    // Fetch users via the junction table
    const { data, error } = await client
      .from('tenant_members')
      .select(`
        role,
        is_active,
        joined_at,
        users (
          id,
          email,
          full_name,
          avatar_url,
          is_active
        )
      `)
      .eq('tenant_id', tenantId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    // Flatten the response for easier consumption
    return data.map((member: any) => ({
      ...member.users,
      tenant_role: member.role,
      tenant_member_active: member.is_active,
      joined_at: member.joined_at,
    }));
  }

  async findOneInTenant(tenantId: string, userId: string) {
    const client = this.supabaseService.getClient();
    
    const { data, error } = await client
      .from('tenant_members')
      .select(`
        role,
        is_active,
        users (
          id,
          email,
          full_name,
          avatar_url,
          created_at
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('User not found in this tenant');
    }

    return {
      ...data.users,
      tenant_role: data.role,
      tenant_member_active: data.is_active,
    };
  }

  async update(tenantId: string, userId: string, updateUserDto: UpdateUserDto) {
    const client = this.supabaseService.getClient();
    
    // Ensure the user actually belongs to this tenant first
    await this.findOneInTenant(tenantId, userId);

    // Update the public.users profile
    const { data, error } = await client
      .from('users')
      .update({
        full_name: updateUserDto.full_name,
        avatar_url: updateUserDto.avatar_url,
        is_active: updateUserDto.is_active,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async remove(tenantId: string, userId: string) {
    const client = this.supabaseService.getClient();
    
    // Soft delete by deactivating their access to THIS specific tenant
    // We don't delete them from public.users because they might belong to another tenant!
    const { error } = await client
      .from('tenant_members')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { message: 'User removed from tenant successfully' };
  }
}
