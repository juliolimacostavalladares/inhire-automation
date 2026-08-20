import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class CreateTenantDto {
  @ApiPropertyOptional({ example: "empresa-exemplo" })
  @ValidateIf((dto: CreateTenantDto) => !dto.name)
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$|^[a-z0-9]$/)
  slug?: string;

  @ApiPropertyOptional({ example: "Empresa Exemplo" })
  @ValidateIf((dto: CreateTenantDto) => !dto.slug)
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;
}
