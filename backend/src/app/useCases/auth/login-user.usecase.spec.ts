import { UnauthorizedException } from '@nestjs/common';
import { LoginUserUseCase } from './login-user.usecase';
import { IUsersRepository } from '../../repositories/users.repository.interface';
import { IPasswordHasher } from '../../providers/password-hasher.provider.interface';
import { ITokenService } from '../../providers/token-service.provider.interface';
import { UserRole } from '../../../domain/enums';

describe('LoginUserUseCase (Clean Architecture)', () => {
  let useCase: LoginUserUseCase;
  let usersRepository: jest.Mocked<IUsersRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let tokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    usersRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findWithPasswordByEmail: jest.fn(),
      update: jest.fn(),
    };

    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    tokenService = {
      signToken: jest.fn(),
      verifyToken: jest.fn(),
    };

    useCase = new LoginUserUseCase(
      usersRepository,
      passwordHasher,
      tokenService,
    );
  });

  it('authenticates user with valid credentials', async () => {
    usersRepository.findWithPasswordByEmail.mockResolvedValue({
      id: 'uuid-1',
      email: 'cand@test.com',
      name: 'Candidato Test',
      role: UserRole.CANDIDATE,
      passwordHash: 'hashed_pwd',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.signToken.mockResolvedValue('jwt_token_123');

    const result = await useCase.execute({
      email: 'cand@test.com',
      password: 'correct_password',
    });

    expect(result.token).toBe('jwt_token_123');
    expect(result.user.id).toBe('uuid-1');
  });

  it('throws UnauthorizedException on invalid password', async () => {
    usersRepository.findWithPasswordByEmail.mockResolvedValue({
      id: 'uuid-1',
      email: 'cand@test.com',
      name: 'Candidato Test',
      role: UserRole.CANDIDATE,
      passwordHash: 'hashed_pwd',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'cand@test.com',
        password: 'wrong_password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when user does not exist', async () => {
    usersRepository.findWithPasswordByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'unknown@test.com',
        password: 'wrong_password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
