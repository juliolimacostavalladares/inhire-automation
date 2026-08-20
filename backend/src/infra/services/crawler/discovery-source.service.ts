import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { TenantOrigin } from "@prisma/client";
import { firstValueFrom } from "rxjs";

export type CandidateEvidence = {
  slug: string;
  source: TenantOrigin;
  evidenceUrl: string;
};
type UrlscanResult = {
  page?: { url?: string };
  task?: { url?: string };
  sort?: Array<string | number>;
};
type UrlscanResponse = { results?: UrlscanResult[]; has_more?: boolean };

@Injectable()
export class DiscoverySourceService {
  private readonly logger = new Logger(DiscoverySourceService.name);
  private readonly hostPattern =
    /https?:\/\/([a-z0-9-]+)\.inhire\.app(?:[/:?#]|$)/i;
  private readonly blocked = new Set([
    "www",
    "api",
    "auth",
    "app",
    "status",
    "login",
    "admin",
    "preview",
    "files",
    "portal",
    "analytics",
  ]);

  constructor(private readonly http: HttpService) {}

  async collectAll(): Promise<CandidateEvidence[]> {
    const results = await Promise.allSettled([
      this.retry(() => this.wayback()),
      this.retry(() => this.urlscan()),
      this.retry(() => this.commonCrawl()),
    ]);
    const evidence = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    for (const result of results) {
      if (result.status === "rejected")
        this.logger.warn(`Discovery source failed: ${String(result.reason)}`);
    }
    if (results.every((result) => result.status === "rejected"))
      throw new Error("All discovery sources failed");
    return [
      ...new Map(
        evidence.map((item) => [
          `${item.slug}|${item.source}|${item.evidenceUrl}`,
          item,
        ]),
      ).values(),
    ];
  }

  private async retry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < 2)
          await new Promise((resolve) =>
            setTimeout(resolve, 1_000 * 2 ** attempt),
          );
      }
    }
    throw lastError;
  }

  private async wayback(): Promise<CandidateEvidence[]> {
    const url =
      "https://web.archive.org/cdx/search/cdx?url=*.inhire.app&output=text&fl=original&collapse=urlkey&limit=200000";
    const response = await firstValueFrom(
      this.http.get<string>(url, { timeout: 60_000, responseType: "text" }),
    );
    return String(response.data)
      .split(/\r?\n/)
      .map((line) => this.fromUrl(line, TenantOrigin.WAYBACK))
      .filter((item): item is CandidateEvidence => Boolean(item));
  }

  private async urlscan(): Promise<CandidateEvidence[]> {
    const evidence: CandidateEvidence[] = [];
    let endpoint =
      "https://urlscan.io/api/v1/search/?q=domain:inhire.app&size=100";
    for (let page = 0; page < 5 && endpoint; page++) {
      const response = await firstValueFrom(
        this.http.get<UrlscanResponse>(endpoint, { timeout: 30_000 }),
      );
      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];
      for (const result of results) {
        const urls = [result?.page?.url, result?.task?.url].filter(
          (value): value is string => typeof value === "string",
        );
        for (const url of urls) {
          const item = this.fromUrl(url, TenantOrigin.URLSCAN);
          if (item) evidence.push(item);
        }
      }
      const next = response.data.has_more && results.at(-1)?.sort?.[0];
      endpoint = next
        ? `https://urlscan.io/api/v1/search/?q=domain:inhire.app&size=100&search_after=${encodeURIComponent(String(next))}`
        : "";
    }
    return evidence;
  }

  private async commonCrawl(): Promise<CandidateEvidence[]> {
    const indexResponse = await firstValueFrom(
      this.http.get<{ id: string }[]>(
        "https://index.commoncrawl.org/collinfo.json",
        { timeout: 30_000 },
      ),
    );
    const indexes = indexResponse.data.slice(0, 12);
    const evidence: CandidateEvidence[] = [];
    for (const index of indexes) {
      const endpoint = `https://index.commoncrawl.org/${encodeURIComponent(index.id)}-index?url=*.inhire.app&output=json&fl=url`;
      const response = await firstValueFrom(
        this.http.get<string>(endpoint, {
          timeout: 60_000,
          responseType: "text",
        }),
      );
      for (const line of String(response.data).split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as { url?: string };
          const item = this.fromUrl(
            parsed.url ?? "",
            TenantOrigin.COMMON_CRAWL,
          );
          if (item) evidence.push(item);
        } catch {
          // A malformed index line is ignored without discarding the remaining source.
        }
      }
    }
    return evidence;
  }

  private fromUrl(url: string, source: TenantOrigin): CandidateEvidence | null {
    const match = url.match(this.hostPattern);
    if (!match) return null;
    const slug = match[1].toLowerCase();
    if (this.blocked.has(slug) || slug.length < 2 || slug.length > 100)
      return null;
    return { slug, source, evidenceUrl: url.slice(0, 2_000) };
  }
}
