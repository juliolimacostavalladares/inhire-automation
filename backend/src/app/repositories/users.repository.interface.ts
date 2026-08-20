import { ICreateUserDTO, IUpdateUserDTO, IUserOutputDTO } from '../../domain/dtos';

export const USERS_REPOSITORY_TOKEN = Symbol.for('USERS_REPOSITORY_TOKEN');

export interface IUsersRepository {
  create(data: ICreateUserDTO): Promise<IUserOutputDTO>;
  findByEmail(email: string): Promise<IUserOutputDTO | null>;
  findById(id: string): Promise<IUserOutputDTO | null>;
  findWithPasswordByEmail(email: string): Promise<(IUserOutputDTO & { passwordHash: string }) | null>;
  update(id: string, data: IUpdateUserDTO): Promise<IUserOutputDTO>;
}
