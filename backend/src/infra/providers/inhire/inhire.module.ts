import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { InhireClientService } from "./inhire-client.service";

@Module({
  imports: [HttpModule],
  providers: [InhireClientService],
  exports: [InhireClientService],
})
export class InhireModule {}
