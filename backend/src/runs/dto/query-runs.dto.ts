import { ApiPropertyOptional } from "@nestjs/swagger";
import { RunStatus, RunType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "../../common/pagination.dto";

export class QueryRunsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RunType })
  @IsOptional()
  @IsEnum(RunType)
  type?: RunType;

  @ApiPropertyOptional({ enum: RunStatus })
  @IsOptional()
  @IsEnum(RunStatus)
  status?: RunStatus;
}
