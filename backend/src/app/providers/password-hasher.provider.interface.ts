export const PASSWORD_HASHER_TOKEN = Symbol.for('PASSWORD_HASHER_TOKEN');

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
