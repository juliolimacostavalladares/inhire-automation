import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { ApiKeyGuard } from './api-key.guard';
import { REQUIRE_ADMIN, REQUIRE_USER } from './auth-context';

describe('ApiKeyGuard', () => {
  const correctApiKey = 'correct-key-with-at-least-32-characters';
  const jwtSecret = 'jwt-secret-key-1234567890';

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'apiKey') return correctApiKey;
      if (key === 'jwtSecret') return jwtSecret;
      return undefined;
    }),
  } as unknown as ConfigService<never, true>;

  let reflectorMock: jest.Mocked<Reflector>;
  let jwtServiceMock: jest.Mocked<JwtService>;

  const createContext = (
    headers: Record<string, string> = {},
    metadata: Record<string, boolean> = {},
  ) => {
    const req: Record<string, unknown> = {
      header: (name: string) => headers[name.toLowerCase()],
    };

    reflectorMock.getAllAndOverride.mockImplementation((key: unknown) => {
      return typeof key === 'string' ? (metadata[key] ?? false) : false;
    });

    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as Parameters<ApiKeyGuard['canActivate']>[0];
  };

  beforeEach(() => {
    reflectorMock = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    jwtServiceMock = {
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
  });

  it('allows access to public routes without any credentials', () => {
    const guard = new ApiKeyGuard(configMock, reflectorMock, jwtServiceMock);
    const ctx = createContext({}, { public: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access to public routes even if token is invalid (treats as anonymous)', () => {
    jwtServiceMock.verify.mockImplementation(() => {
      throw new Error('Expired');
    });
    const guard = new ApiKeyGuard(configMock, reflectorMock, jwtServiceMock);
    const ctx = createContext(
      { authorization: 'Bearer invalid-token' },
      { public: true },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('authenticates valid JWT on user-protected routes', () => {
    jwtServiceMock.verify.mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      role: 'CANDIDATE',
    });
    const guard = new ApiKeyGuard(configMock, reflectorMock, jwtServiceMock);
    const ctx = createContext(
      { authorization: 'Bearer valid-jwt' },
      { [REQUIRE_USER]: true },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws UnauthorizedException on protected route without credentials', () => {
    const guard = new ApiKeyGuard(configMock, reflectorMock, jwtServiceMock);
    const ctx = createContext({}, { [REQUIRE_USER]: true });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('authenticates valid API key on system routes', () => {
    const guard = new ApiKeyGuard(configMock, reflectorMock, jwtServiceMock);
    const ctx = createContext({ 'x-api-key': correctApiKey });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects invalid API key on system routes', () => {
    const guard = new ApiKeyGuard(configMock, reflectorMock, jwtServiceMock);
    const ctx = createContext({ 'x-api-key': 'wrong-key' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('rejects candidate user when admin role is required', () => {
    jwtServiceMock.verify.mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      role: 'CANDIDATE',
    });
    const guard = new ApiKeyGuard(configMock, reflectorMock, jwtServiceMock);
    const ctx = createContext(
      { authorization: 'Bearer valid-jwt' },
      { [REQUIRE_ADMIN]: true },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
