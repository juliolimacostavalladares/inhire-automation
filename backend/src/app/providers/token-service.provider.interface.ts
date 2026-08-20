export const TOKEN_SERVICE_TOKEN = Symbol('TOKEN_SERVICE_TOKEN');

export interface ITokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface ITokenService {
  signToken(payload: ITokenPayload): Promise<string>;
  verifyToken<T extends object = ITokenPayload>(token: string): Promise<T>;
}
