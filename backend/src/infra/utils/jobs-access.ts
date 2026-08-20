import { ForbiddenException } from "@nestjs/common";
import type { QueryJobsDto } from "../../presentation/http/dto/query-jobs.dto";
import type { AuthContext } from "../../presentation/http/guards/auth-context";

const FILTER_KEYS = [
  "tenantId",
  "workplaceType",
  "location",
  "title",
  "firstSeenFrom",
  "firstSeenTo",
  "publishedFrom",
  "publishedTo",
] as const;

export function enforceJobsListPolicy(query: QueryJobsDto, auth: AuthContext = { type: "anonymous" }) {
  const filters = FILTER_KEYS.filter((key) => query[key] !== undefined);

  if (auth.type === "anonymous") {
    if (query.page > 1 || query.limit > 10 || filters.length > 0) {
      throw new ForbiddenException("Faça login para usar filtros e consultar mais vagas.");
    }
    return;
  }

  if (auth.type === "apiKey") {
    if (query.page > 10 || query.limit > 25) {
      throw new ForbiddenException("Acesso por API key limitado a 10 páginas e 25 vagas por página.");
    }
    if (filters.length > 2) {
      throw new ForbiddenException("Acesso por API key permite no máximo dois filtros por consulta.");
    }
    return;
  }

  if (query.page > 100 || query.limit > 100) {
    throw new ForbiddenException("Limite de paginação excedido.");
  }
}
