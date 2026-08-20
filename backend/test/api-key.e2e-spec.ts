import { Controller, Get, INestApplication, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { ApiKeyGuard } from "../src/presentation/http/guards/api-key.guard";

@Controller("protected")
@UseGuards(ApiKeyGuard)
class ProtectedController {
  @Get()
  get() {
    return { ok: true };
  }
}

describe("API key authentication (e2e)", () => {
  const apiKey = "test-api-key-with-at-least-32-characters";
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProtectedController],
      providers: [
        ApiKeyGuard,
        { provide: ConfigService, useValue: { get: () => apiKey } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it("rejects a request without the API key", async () => {
    await request(app.getHttpServer()).get("/protected").expect(401);
  });

  it("accepts a request with the configured API key", async () => {
    await request(app.getHttpServer())
      .get("/protected")
      .set("X-API-Key", apiKey)
      .expect(200, { ok: true });
  });
});
