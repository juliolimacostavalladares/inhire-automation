import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IUserOutputDTO } from '../../../domain/dtos';
import { User } from '../../../domain/entities';
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

export interface IRegisterUserResponse {
  user: IUserOutputDTO;
  token: string;
}

@Injectable()
export class RegisterUserUseCase {
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
    name: string;
    password: string;
  }): Promise<IRegisterUserResponse> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const userEntity = new User({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    const created = await this.usersRepository.create({
      email: userEntity.email.value,
      name: userEntity.name,
      passwordHash: userEntity.passwordHash,
      role: userEntity.role,
    });

    const token = await this.tokenService.signToken({
      sub: created.id,
      email: created.email,
      role: created.role,
    });

    return { user: created, token };
  }
}
