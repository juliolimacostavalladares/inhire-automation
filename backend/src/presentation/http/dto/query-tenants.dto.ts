import { ApiPropertyOptional } from "@nestjs/swagger";
import { TenantOrigin } from "../../../domain/enums";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { PaginationDto } from "./pagination.dto";

function parseBoolean(value: unknown): unknown {
  return value === "true" ? true : value === "false" ? false : value;
}

export class QueryTenantsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: TenantOrigin })
  @IsOptional()
  @IsEnum(TenantOrigin)
  origin?: TenantOrigin;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value as unknown))
  @IsBoolean()
  active?: boolean;
}
