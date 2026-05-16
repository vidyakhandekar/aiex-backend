import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase/supabase.service';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is attached (auth guard hasn't run or failed), deny
    if (!user) {
      return false;
    }

    const client = this.supabaseService.getClient();

    // First check if the user is a super_admin in the users table
    const { data: userProfile } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile && userProfile.role === 'super_admin') {
      request.user.role = 'super_admin';
      // Super admins don't inherently belong to a single tenant context for platform-wide operations
      return true;
    }

    // For regular users/tenant admins, find their tenant
    const { data: tenantMember } = await client
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!tenantMember) {
      throw new ForbiddenException('User does not belong to any active tenant.');
    }

    // Attach tenantId and the user's tenant-specific role to the request
    request.tenantId = tenantMember.tenant_id;
    request.user.role = tenantMember.role; // e.g., 'tenant_admin' or 'student'

    return true;
  }
}
