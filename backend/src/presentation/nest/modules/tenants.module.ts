import { Module } from '@nestjs/common';
import { InhireModule } from '../../../infra/providers/inhire/inhire.module';
import { TenantsController } from '../../http/controllers/tenants.controller';
import { ListTenantsUseCase } from '../../../app/useCases/tenants/list-tenants.usecase';
import { GetTenantUseCase } from '../../../app/useCases/tenants/get-tenant.usecase';
import { CreateTenantUseCase } from '../../../app/useCases/tenants/create-tenant.usecase';
import { UpdateTenantUseCase } from '../../../app/useCases/tenants/update-tenant.usecase';
import { DeactivateTenantUseCase } from '../../../app/useCases/tenants/deactivate-tenant.usecase';
import { TENANTS_REPOSITORY_TOKEN } from '../../../app/repositories/tenants.repository.interface';
import { PrismaTenantsRepository } from '../../../infra/repositories/prisma-tenants.repository';

@Module({
  imports: [InhireModule],
  controllers: [TenantsController],
  providers: [
    { provide: TENANTS_REPOSITORY_TOKEN, useClass: PrismaTenantsRepository },
    ListTenantsUseCase,
    GetTenantUseCase,
    CreateTenantUseCase,
    UpdateTenantUseCase,
    DeactivateTenantUseCase,
  ],
  exports: [
    TENANTS_REPOSITORY_TOKEN,
    ListTenantsUseCase,
    GetTenantUseCase,
    CreateTenantUseCase,
    UpdateTenantUseCase,
    DeactivateTenantUseCase,
  ],
})
export class TenantsModule {}
