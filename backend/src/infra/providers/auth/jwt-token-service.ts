import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ITokenPayload,
  ITokenService,
} from '../../../app/providers/token-service.provider.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwt: JwtService) {}

  async signToken(payload: ITokenPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  async verifyToken<T extends object = ITokenPayload>(token: string): Promise<T> {
    return this.jwt.verifyAsync<T>(token);
  }
}
