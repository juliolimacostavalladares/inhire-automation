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
    expect(loadEnvironment()).toMatchObject({ port: 3000, redisPort: 6379 });
  });

  it("rejects a weak API key", () => {
    process.env.API_KEY = "short";
    expect(() => loadEnvironment()).toThrow(
      "API_KEY must contain at least 32 characters",
    );
  });
});
