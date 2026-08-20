import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IPasswordHasher,
  PASSWORD_HASHER_TOKEN,
} from '../../providers/password-hasher.provider.interface';
import {
  ITokenService,
  TOKEN_SERVICE_TOKEN,
} from '../../providers/token-service.provider.interface';
import {
  IUsersRepository,
  USERS_REPOSITORY_TOKEN,
} from '../../repositories/users.repository.interface';
import { IRegisterUserResponse } from './register-user.usecase';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: {
    email: string;
    password: string;
  }): Promise<IRegisterUserResponse> {
    const userWithPassword = await this.usersRepository.findWithPasswordByEmail(
      dto.email,
    );
    if (!userWithPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await this.passwordHasher.compare(
      dto.password,
      userWithPassword.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = {
      id: userWithPassword.id,
      email: userWithPassword.email,
      name: userWithPassword.name,
      role: userWithPassword.role,
      createdAt: userWithPassword.createdAt,
      updatedAt: userWithPassword.updatedAt,
    };
    const token = await this.tokenService.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }
}
