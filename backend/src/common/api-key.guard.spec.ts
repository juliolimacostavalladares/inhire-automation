import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { ApiKeyGuard } from "./api-key.guard";

describe("ApiKeyGuard", () => {
  const key = "correct-key-with-at-least-32-characters";
  const config = { get: () => key } as unknown as ConfigService<any, true>;
  const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
  const request = (value?: string) => ({ header: () => value });
  const context = (value?: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => request(value) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as any;

  it("accepts the configured key", () => {
    expect(new ApiKeyGuard(config, reflector).canActivate(context(key))).toBe(
      true,
    );
  });

  it("rejects missing and invalid keys", () => {
    const guard = new ApiKeyGuard(config, reflector);
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context("wrong"))).toThrow(
      UnauthorizedException,
    );
  });
});
