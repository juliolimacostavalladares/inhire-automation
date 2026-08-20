import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ITenantOutputDTO } from '../../../domain/dtos';
import { TenantOrigin } from '../../../domain/enums';
import { InhireClientService } from '../../../infra/providers/inhire/inhire-client.service';
import { slugVariants } from '../../../infra/utils/slug.util';
import {
  ITenantsRepository,
  TENANTS_REPOSITORY_TOKEN,
} from '../../repositories/tenants.repository.interface';

@Injectable()
export class CreateTenantUseCase {
  constructor(
    @Inject(TENANTS_REPOSITORY_TOKEN)
    private readonly tenantsRepository: ITenantsRepository,
    private readonly inhire: InhireClientService,
  ) {}

  async execute(dto: { name?: string; slug?: string }): Promise<ITenantOutputDTO> {
    if (Boolean(dto.slug) === Boolean(dto.name)) {
      throw new BadRequestException('Provide exactly one of name or slug');
    }
    const candidates = dto.slug
      ? [dto.slug.toLowerCase()]
      : slugVariants(dto.name!);

    const matches: { slug: string; name: string; logoUrl?: string | null }[] = [];
    for (const slug of candidates) {
      const result = await this.inhire.fetchTenant(slug);
      if (result) {
        matches.push({
          slug,
          name: result.tenantName || dto.name || slug,
          logoUrl: result.logo || null,
        });
      }
    }

    const unique = [
      ...new Map(matches.map((match) => [match.slug, match])).values(),
    ];
    if (unique.length === 0) {
      throw new UnprocessableEntityException('No valid InHire tenant found');
    }
    if (unique.length > 1) {
      throw new ConflictException({
        message: 'Multiple tenants found',
        candidates: unique,
      });
    }

    const match = unique[0];
    const existing = await this.tenantsRepository.findBySlug(match.slug);
    if (existing) {
      throw new ConflictException('Tenant already exists');
    }

    return this.tenantsRepository.create({
      slug: match.slug,
      name: match.name,
      logoUrl: match.logoUrl,
      origin: TenantOrigin.MANUAL,
      lastValidatedAt: new Date(),
    });
  }
}
