import {
  IsArray,
  ArrayMaxSize,
  IsString,
  MaxLength,
  IsUrl,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

// ─── Sub-DTOs para arrays estruturados ──────────────────────────────────────

export class ExperienceDto {
  @IsString() @IsNotEmpty() @MaxLength(200) company!: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(20) startMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(10) startYear?: string | null;
  @IsOptional() @IsString() @MaxLength(20) endMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(10) endYear?: string | null;
  @IsBoolean() ongoing!: boolean;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(10000) description?: string | null;
}

export class EducationDto {
  @IsString() @IsNotEmpty() @MaxLength(200) school!: string;
  @IsOptional() @IsString() @MaxLength(200) degree?: string | null;
  @IsOptional() @IsString() @MaxLength(200) field?: string | null;
  @IsOptional() @IsString() @MaxLength(20) startMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(10) startYear?: string | null;
  @IsOptional() @IsString() @MaxLength(20) endMonth?: string | null;
  @IsOptional() @IsString() @MaxLength(10) endYear?: string | null;
  @IsBoolean() ongoing!: boolean;
}

// ─── DTOs principais ─────────────────────────────────────────────────────────

export class ImportProfileDto {
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(500)
  linkedinProfileUrl!: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsUrl({ protocols: ["https"], require_protocol: true }) @MaxLength(500)
  linkedinProfileUrl?: string;

  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(180) professionalTitle?: string;
  @IsOptional() @IsString() @MaxLength(180) professionalArea?: string;
  @IsOptional() @IsString() @MaxLength(80)  seniority?: string;
  @IsOptional() @IsString() @MaxLength(180) location?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) workModalities?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) contractTypes?: string[];
  @IsOptional() @IsString() @MaxLength(100) salaryExpectation?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsString() @MaxLength(10000) summary?: string;
  @IsOptional() @IsBoolean() alertsEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];
}
