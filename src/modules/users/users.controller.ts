import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantContextGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('invite')
  @Roles('tenant_admin') // Only tenant admins can invite new users to their tenant
  @ApiOperation({ summary: 'Invite a new user (student/admin) to the current tenant' })
  @ApiResponse({ status: 201, description: 'User successfully invited' })
  inviteUser(
    @Tenant() tenantId: string,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    return this.usersService.inviteUser(tenantId, inviteUserDto);
  }

  @Get()
  @Roles('tenant_admin') // Only admins see all users
  @ApiOperation({ summary: 'List all users in the current tenant' })
  findAll(@Tenant() tenantId: string) {
    return this.usersService.findAllInTenant(tenantId);
  }

  @Get(':id')
  @Roles('tenant_admin', 'student') 
  @ApiOperation({ summary: 'Get details of a specific user in the current tenant' })
  findOne(
    @Tenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.findOneInTenant(tenantId, id);
  }

  @Patch(':id')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Update a user profile within the current tenant' })
  update(
    @Tenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(tenantId, id, updateUserDto);
  }

  @Delete(':id')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Remove (soft delete) a user from the current tenant' })
  remove(
    @Tenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.remove(tenantId, id);
  }
}
