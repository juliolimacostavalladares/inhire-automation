import {
  IsArray,
  ArrayMaxSize,
  IsString,
  MaxLength,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// ─── Sub-DTOs para arrays estruturados ──────────────────────────────────────

export class ExperienceDto {
  @IsOptional() @IsString() @MaxLength(200) company?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(40)  startMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(20)  startYear?: string | null;
  @IsOptional() @IsString() @MaxLength(40)  endMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(20)  endYear?: string | null;
  @IsOptional() @IsBoolean() ongoing?: boolean;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(20000) description?: string | null;
}

export class EducationDto {
  @IsOptional() @IsString() @MaxLength(200) school?: string;
  @IsOptional() @IsString() @MaxLength(200) degree?: string | null;
  @IsOptional() @IsString() @MaxLength(200) field?: string | null;
  @IsOptional() @IsString() @MaxLength(40)  startMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(20)  startYear?: string | null;
  @IsOptional() @IsString() @MaxLength(40)  endMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(20)  endYear?: string | null;
  @IsOptional() @IsBoolean() ongoing?: boolean;
}

export class ImportProfileDto {
  @IsString()
  @MaxLength(500)
  linkedinProfileUrl!: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(500)
  linkedinProfileUrl?: string;

  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(180) professionalTitle?: string;
  @IsOptional() @IsString() @MaxLength(180) professionalArea?: string;
  @IsOptional() @IsString() @MaxLength(80)  seniority?: string;
  @IsOptional() @IsString() @MaxLength(180) location?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) workModalities?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) contractTypes?: string[];
  @IsOptional() @IsString() @MaxLength(100) salaryExpectation?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsString() @MaxLength(30000) summary?: string;
  @IsOptional() @IsBoolean() alertsEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];
}
