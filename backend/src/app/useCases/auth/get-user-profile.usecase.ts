import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserOutputDTO } from '../../../domain/dtos';
import {
  IUsersRepository,
  USERS_REPOSITORY_TOKEN,
} from '../../repositories/users.repository.interface';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(userId: string): Promise<IUserOutputDTO> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
