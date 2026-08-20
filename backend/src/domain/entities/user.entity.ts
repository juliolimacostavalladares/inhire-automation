import { UserRole } from '../enums';
import { Email } from '../valueObjects/email.vo';

export interface UserProps {
  id?: string;
  email: Email | string;
  name: string;
  passwordHash: string;
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private readonly _id?: string;
  private _email: Email;
  private _name: string;
  private _passwordHash: string;
  private _role: UserRole;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email =
      props.email instanceof Email ? props.email : new Email(props.email);
    this._name = (props.name || '').trim();
    if (!this._name || this._name.length < 2) {
      throw new Error('Nome de usuário deve ter pelo menos 2 caracteres');
    }
    this._passwordHash = props.passwordHash;
    this._role = props.role ?? UserRole.CANDIDATE;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): UserRole {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  changeName(name: string): void {
    const trimmed = (name || '').trim();
    if (!trimmed || trimmed.length < 2) {
      throw new Error('Nome de usuário deve ter pelo menos 2 caracteres');
    }
    this._name = trimmed;
    this._updatedAt = new Date();
  }

  changePasswordHash(newHash: string): void {
    this._passwordHash = newHash;
    this._updatedAt = new Date();
  }
}
