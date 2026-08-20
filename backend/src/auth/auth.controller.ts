import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AllowJwt, Public, RequireUser } from "../common/api-key.guard";
import type { AuthenticatedRequest } from "../common/auth-context";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";

@Controller("auth")
@AllowJwt()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  async register(@Body() input: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.register(input);
    this.setSessionCookie(response, session.accessToken);
    return { user: session.user, token: session.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(input);
    this.setSessionCookie(response, session.accessToken);
    return { user: session.user, token: session.accessToken };
  }

  @Public()
  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("inhire_session", this.cookieOptions());
    return { success: true };
  }

  @RequireUser()
  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    if (request.auth?.type !== "jwt") throw new Error("Authenticated user missing");
    return this.auth.me(request.auth.userId);
  }

  private setSessionCookie(response: Response, token: string) {
    response.cookie("inhire_session", token, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
  }
}
