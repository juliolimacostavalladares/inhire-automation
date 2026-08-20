import { loadEnvironment } from "./environment";

describe("environment configuration", () => {
  const original = process.env;

  beforeEach(() => {
    process.env = {
      ...original,
      API_KEY: "a".repeat(32),
      DATABASE_URL: "postgresql://localhost/test",
      REDIS_PORT: "6379",
    };
  });

  afterAll(() => {
    process.env = original;
  });

  it("parses validated configuration", () => {
    expect(loadEnvironment()).toMatchObject({
      port: 3000,
      redisPort: 6379,
      aiProvider: "9router",
      aiBaseUrl: "http://localhost:20128",
      aiDefaultModel: "openai/gpt-4o",
    });
  });

  it("accepts custom 9router / AI configurations", () => {
    process.env.NINEROUTER_URL = "https://ai.example.com/v1/";
    process.env.NINEROUTER_KEY = "sk-secret-123";
    process.env.AI_DEFAULT_MODEL = "anthropic/claude-3-5-sonnet";
    expect(loadEnvironment()).toMatchObject({
      aiBaseUrl: "https://ai.example.com/v1",
      aiApiKey: "sk-secret-123",
      aiDefaultModel: "anthropic/claude-3-5-sonnet",
    });
  });

  it("rejects a weak API key", () => {
    process.env.API_KEY = "short";
    expect(() => loadEnvironment()).toThrow(
      "API_KEY must contain at least 32 characters",
    );
  });
});
