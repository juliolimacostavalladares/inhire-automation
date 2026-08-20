import { ConflictException } from '@nestjs/common';
import { RegisterUserUseCase } from './register-user.usecase';
import { IUsersRepository } from '../../repositories/users.repository.interface';
import { IPasswordHasher } from '../../providers/password-hasher.provider.interface';
import { ITokenService } from '../../providers/token-service.provider.interface';
import { UserRole } from '../../../domain/enums';

describe('RegisterUserUseCase (Clean Architecture)', () => {
  let useCase: RegisterUserUseCase;
  let findByEmailMock: jest.Mock;
  let createMock: jest.Mock;
  let hashMock: jest.Mock;
  let signTokenMock: jest.Mock;

  beforeEach(() => {
    findByEmailMock = jest.fn();
    createMock = jest.fn();
    hashMock = jest.fn();
    signTokenMock = jest.fn();

    const usersRepository: IUsersRepository = {
      create: createMock,
      findByEmail: findByEmailMock,
      findById: jest.fn(),
      findWithPasswordByEmail: jest.fn(),
      update: jest.fn(),
    };

    const passwordHasher: IPasswordHasher = {
      hash: hashMock,
      compare: jest.fn(),
    };

    const tokenService: ITokenService = {
      signToken: signTokenMock,
      verifyToken: jest.fn(),
    };

    useCase = new RegisterUserUseCase(
      usersRepository,
      passwordHasher,
      tokenService,
    );
  });

  it('creates user and issues JWT token when email is new', async () => {
    findByEmailMock.mockResolvedValue(null);
    hashMock.mockResolvedValue('hashed_pwd');
    createMock.mockResolvedValue({
      id: 'uuid-1',
      email: 'cand@test.com',
      name: 'Candidato Test',
      role: UserRole.CANDIDATE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    signTokenMock.mockResolvedValue('jwt_token_xyz');

    const result = await useCase.execute({
      email: 'cand@test.com',
      name: 'Candidato Test',
      password: 'password123',
    });

    expect(result.user.id).toBe('uuid-1');
    expect(result.token).toBe('jwt_token_xyz');
    expect(hashMock).toHaveBeenCalledWith('password123');
  });

  it('throws ConflictException if email is already registered', async () => {
    findByEmailMock.mockResolvedValue({
      id: 'uuid-1',
      email: 'cand@test.com',
      name: 'Existing',
      role: UserRole.CANDIDATE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute({
        email: 'cand@test.com',
        name: 'Test',
        password: 'pwd',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
