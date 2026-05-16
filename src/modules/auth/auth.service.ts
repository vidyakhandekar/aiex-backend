import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase/supabase.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async login(loginDto: LoginDto) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async logout(token: string) {
    const client = this.supabaseService.getClient();
    // Use the specific token to sign out
    const { error } = await client.auth.admin.signOut(token);
    
    if (error) {
      throw new BadRequestException(error.message);
    }
    
    return { message: 'Logged out successfully' };
  }
}
