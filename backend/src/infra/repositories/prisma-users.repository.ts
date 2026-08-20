import { Injectable } from '@nestjs/common';
import { ICreateUserDTO, IUpdateUserDTO, IUserOutputDTO } from '../../domain/dtos';
import { UserRole } from '../../domain/enums';
import { IUsersRepository } from '../../app/repositories/users.repository.interface';
import { PrismaService } from '../databases/prisma/prisma.service';

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateUserDTO): Promise<IUserOutputDTO> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role ?? UserRole.CANDIDATE,
      },
    });
    return this.toOutputDTO(user);
  }

  async findByEmail(email: string): Promise<IUserOutputDTO | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user ? this.toOutputDTO(user) : null;
  }

  async findById(id: string): Promise<IUserOutputDTO | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toOutputDTO(user) : null;
  }

  async findWithPasswordByEmail(
    email: string,
  ): Promise<(IUserOutputDTO & { passwordHash: string }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) return null;
    return {
      ...this.toOutputDTO(user),
      passwordHash: user.passwordHash,
    };
  }

  async update(id: string, data: IUpdateUserDTO): Promise<IUserOutputDTO> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
        ...(data.role ? { role: data.role } : {}),
      },
    });
    return this.toOutputDTO(user);
  }

  private toOutputDTO(user: {
    id: string;
    email: string;
    name: string;
    role: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): IUserOutputDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
