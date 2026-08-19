import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { QueryTenantsDto } from "./dto/query-tenants.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { TenantsService } from "./tenants.service";
import { AllowJwt, RequireAdmin } from "../common/api-key.guard";

@ApiTags("tenants")
@Controller("tenants")
@AllowJwt()
@RequireAdmin()
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  list(@Query() query: QueryTenantsDto) {
    return this.tenants.list(query);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.tenants.get(id);
  }

  @Post()
  @ApiCreatedResponse({ description: "Tenant validated and created" })
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(id, dto);
  }

  @Delete(":id")
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.tenants.deactivate(id);
  }
}
