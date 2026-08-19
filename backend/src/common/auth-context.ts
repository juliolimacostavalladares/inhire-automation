import type { Request } from "express";

export type AuthContext =
  | { type: "anonymous" }
  | { type: "apiKey" }
  | { type: "jwt"; userId: string; email: string; role: string };

export type AuthenticatedRequest = Request & { auth?: AuthContext };

export const REQUIRE_USER = "require-user";
export const ALLOW_JWT = "allow-jwt";
export const REQUIRE_ADMIN = "require-admin";
