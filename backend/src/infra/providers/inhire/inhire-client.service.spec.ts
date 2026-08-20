import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { of } from "rxjs";
import { InhireClientService } from "./inhire-client.service";

describe("InhireClientService", () => {
  const response = (data: unknown) => of({ data } as AxiosResponse<unknown>);

  it("accepts a complete tenant response", async () => {
    const http = {
      get: jest.fn(() =>
        response({
          tenantName: "Example",
          jobsPage: [
            { jobId: "job-1", displayName: "Developer", status: "Published" },
          ],
        }),
      ),
    } as unknown as HttpService;

    await expect(
      new InhireClientService(http).fetchTenant("example"),
    ).resolves.toMatchObject({
      tenantName: "Example",
    });
  });

  it("rejects malformed job data so it cannot close stored jobs", async () => {
    const http = {
      get: jest.fn(() =>
        response({
          tenantName: "Example",
          jobsPage: [{ displayName: "Missing id" }],
        }),
      ),
    } as unknown as HttpService;

    await expect(
      new InhireClientService(http).fetchTenant("example"),
    ).resolves.toBeNull();
  });

  it("recognizes the array response used for nonexistent tenants", async () => {
    const http = { get: jest.fn(() => response([])) } as unknown as HttpService;
    await expect(
      new InhireClientService(http).fetchTenant("missing"),
    ).resolves.toBeNull();
  });

  it("loads the public job detail including description and publication dates", async () => {
    const get = jest.fn((url: string, options: unknown) => {
      void url;
      void options;
      return response({
        jobId: "job-1",
        displayName: "Developer",
        description: "<p>Descrição</p>",
        publishedAt: "2026-08-01T12:00:00.000Z",
        lastPublishedAt: "2026-08-10T12:00:00.000Z",
      });
    });
    const http = {
      get,
    } as unknown as HttpService;

    const result = await new InhireClientService(http).fetchJobDetail(
      "example",
      "job-1",
    );
    expect(result).toMatchObject({
      description: "<p>Descrição</p>",
      publishedAt: "2026-08-01T12:00:00.000Z",
    });
    expect(get).toHaveBeenCalledTimes(1);
    const [url, options] = get.mock.calls[0];
    expect(url.endsWith("/job-1")).toBe(true);
    expect(options).toMatchObject({ headers: { "X-Tenant": "example" } });
  });
});
