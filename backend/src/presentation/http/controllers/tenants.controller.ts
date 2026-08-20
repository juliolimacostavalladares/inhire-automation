import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard, Public } from '../guards/api-key.guard';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { QueryTenantsDto } from '../dto/query-tenants.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { ListTenantsUseCase } from '../../../app/useCases/tenants/list-tenants.usecase';
import { GetTenantUseCase } from '../../../app/useCases/tenants/get-tenant.usecase';
import { CreateTenantUseCase } from '../../../app/useCases/tenants/create-tenant.usecase';
import { UpdateTenantUseCase } from '../../../app/useCases/tenants/update-tenant.usecase';
import { DeactivateTenantUseCase } from '../../../app/useCases/tenants/deactivate-tenant.usecase';

@Controller('tenants')
@UseGuards(ApiKeyGuard)
export class TenantsController {
  constructor(
    private readonly listTenantsUseCase: ListTenantsUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
    private readonly deactivateTenantUseCase: DeactivateTenantUseCase,
  ) {}

  @Public()
  @Get()
  async list(@Query() query: QueryTenantsDto) {
    return this.listTenantsUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.getTenantUseCase.execute(id);
  }

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    return this.createTenantUseCase.execute(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.updateTenantUseCase.execute(id, dto);
  }

  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    return this.deactivateTenantUseCase.execute(id);
  }
}
