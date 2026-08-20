import { Module } from '@nestjs/common';
import { AuthController } from '../../http/controllers/auth.controller';
import { RegisterUserUseCase } from '../../../app/useCases/auth/register-user.usecase';
import { LoginUserUseCase } from '../../../app/useCases/auth/login-user.usecase';
import { GetUserProfileUseCase } from '../../../app/useCases/auth/get-user-profile.usecase';
import { USERS_REPOSITORY_TOKEN } from '../../../app/repositories/users.repository.interface';
import { PrismaUsersRepository } from '../../../infra/repositories/prisma-users.repository';
import { PASSWORD_HASHER_TOKEN } from '../../../app/providers/password-hasher.provider.interface';
import { BcryptPasswordHasher } from '../../../infra/providers/auth/bcrypt-password-hasher';
import { TOKEN_SERVICE_TOKEN } from '../../../app/providers/token-service.provider.interface';
import { JwtTokenService } from '../../../infra/providers/auth/jwt-token-service';

@Module({
  controllers: [AuthController],
  providers: [
    { provide: USERS_REPOSITORY_TOKEN, useClass: PrismaUsersRepository },
    { provide: PASSWORD_HASHER_TOKEN, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE_TOKEN, useClass: JwtTokenService },
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
  ],
  exports: [
    USERS_REPOSITORY_TOKEN,
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
  ],
})
export class AuthModule {}
