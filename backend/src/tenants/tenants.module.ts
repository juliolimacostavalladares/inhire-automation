import { Module } from "@nestjs/common";
import { InhireModule } from "../inhire/inhire.module";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  imports: [InhireModule],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
