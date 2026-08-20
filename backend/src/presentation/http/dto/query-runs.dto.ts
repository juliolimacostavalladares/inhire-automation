import { ApiPropertyOptional } from "@nestjs/swagger";
import { RunStatus, RunType } from "../../../domain/enums";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "./pagination.dto";

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
