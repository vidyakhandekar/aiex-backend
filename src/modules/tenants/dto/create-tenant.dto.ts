import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Allen Pune' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'allen-pune' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'pro' })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({ example: { theme: 'dark' } })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
