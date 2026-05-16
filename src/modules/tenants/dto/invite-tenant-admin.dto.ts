import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteTenantAdminDto {
  @ApiProperty({ example: 'admin@allenpune.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'Admin Name' })
  @IsString()
  @IsOptional()
  full_name?: string;
}
