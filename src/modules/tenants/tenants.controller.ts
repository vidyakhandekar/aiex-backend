import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantContextGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new tenant (super_admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant successfully created' })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'List all tenants (super_admin only)' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'tenant_admin')
  @ApiOperation({ summary: 'Get details of a specific tenant' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'tenant_admin')
  @ApiOperation({ summary: 'Update a specific tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }
}
