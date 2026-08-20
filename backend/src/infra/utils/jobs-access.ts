import { ForbiddenException } from "@nestjs/common";
import type { QueryJobsDto } from "../../presentation/http/dto/query-jobs.dto";
import type { AuthContext } from "../../presentation/http/guards/auth-context";


export function enforceJobsListPolicy(
  query: QueryJobsDto,
  auth: AuthContext = { type: 'anonymous' },
) {
  if (auth.type === 'anonymous') {
    // Visitantes podem aplicar filtros livremente na busca de vagas, com limite razoável de paginação
    if (query.page > 20 || query.limit > 50) {
      throw new ForbiddenException(
        'Faça login para navegar além das primeiras páginas de vagas.',
      );
    }
    return;
  }

  if (auth.type === 'apiKey') {
    if (query.page > 50 || query.limit > 100) {
      throw new ForbiddenException(
        'Acesso por API key limitado a 50 páginas e 100 vagas por página.',
      );
    }
    return;
  }

  if (query.page > 100 || query.limit > 100) {
    throw new ForbiddenException('Limite de paginação excedido.');
  }
}
