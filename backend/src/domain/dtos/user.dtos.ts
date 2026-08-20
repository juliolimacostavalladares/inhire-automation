import { UserRole } from '../enums';

export interface ICreateUserDTO {
  email: string;
  name: string;
  passwordHash: string;
  role?: UserRole;
}

export interface IUpdateUserDTO {
  name?: string;
  passwordHash?: string;
  role?: UserRole;
}

export interface IUserOutputDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
