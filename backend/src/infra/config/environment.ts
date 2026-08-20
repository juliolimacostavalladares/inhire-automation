export type Environment = {
  port: number;
  apiKey: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  databaseUrl: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  corsOrigins: string[];
  aiProvider: string;
  aiBaseUrl: string;
  aiApiKey?: string;
  aiDefaultModel: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function loadEnvironment(): Environment {
  const apiKey = required("API_KEY");
  if (apiKey.length < 32)
    throw new Error("API_KEY must contain at least 32 characters");

  const port = Number(process.env.PORT ?? 3000);
  const redisPort = Number(process.env.REDIS_PORT ?? 6379);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT is invalid");
  if (!Number.isInteger(redisPort) || redisPort < 1 || redisPort > 65535) {
    throw new Error("REDIS_PORT is invalid");
  }

  const jwtSecret = process.env.JWT_SECRET?.trim() || apiKey;
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET?.trim()) {
    throw new Error("JWT_SECRET is required in production");
  }

  const aiProvider = process.env.AI_PROVIDER?.trim() || "9router";
  const aiBaseUrl = (
    process.env.NINEROUTER_URL ||
    process.env.AI_BASE_URL ||
    "http://localhost:20128"
  )
    .trim()
    .replace(/\/+$/, "");
  const aiApiKey =
    (process.env.NINEROUTER_KEY || process.env.AI_API_KEY || "").trim() ||
    undefined;
  const aiDefaultModel =
    process.env.AI_DEFAULT_MODEL?.trim() || "openai/gpt-4o";

  return {
    port,
    apiKey,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "7d",
    databaseUrl: required("DATABASE_URL"),
    redisHost: process.env.REDIS_HOST?.trim() || "localhost",
    redisPort,
    redisPassword: process.env.REDIS_PASSWORD?.trim() || undefined,
    corsOrigins: (process.env.CORS_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    aiProvider,
    aiBaseUrl,
    aiApiKey,
    aiDefaultModel,
  };
}
