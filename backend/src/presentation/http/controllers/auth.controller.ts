import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiKeyGuard, AllowJwt, Public, RequireUser } from '../guards/api-key.guard';
import { CurrentAuth, type AuthContext } from '../guards/auth-context';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { RegisterUserUseCase } from '../../../app/useCases/auth/register-user.usecase';
import { LoginUserUseCase } from '../../../app/useCases/auth/login-user.usecase';
import { GetUserProfileUseCase } from '../../../app/useCases/auth/get-user-profile.usecase';
import { SessionCookieAdapter } from '../../adapters/session-cookie.adapter';

@Controller('auth')
@UseGuards(ApiKeyGuard)
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registerUserUseCase.execute(body);
    SessionCookieAdapter.setSession(res, result.token);
    return { token: result.token, accessToken: result.token, user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUserUseCase.execute(body);
    SessionCookieAdapter.setSession(res, result.token);
    return { token: result.token, accessToken: result.token, user: result.user };
  }

  @AllowJwt()
  @RequireUser()
  @Get('me')
  async me(@CurrentAuth() auth: AuthContext) {
    if (auth.type !== 'jwt') {
      throw new UnauthorizedException('Authentication required');
    }
    return this.getUserProfileUseCase.execute(auth.userId);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    SessionCookieAdapter.clearSession(res);
    return { message: 'Logged out successfully' };
  }
}
