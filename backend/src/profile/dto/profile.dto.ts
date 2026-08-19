import {
  IsArray,
  ArrayMaxSize,
  IsString,
  MaxLength,
  IsUrl,
  IsBoolean,
  IsOptional,
} from "class-validator";

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
  @IsOptional() @IsString() @MaxLength(80) seniority?: string;
  @IsOptional() @IsString() @MaxLength(180) location?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) workModalities?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) contractTypes?: string[];
  @IsOptional() @IsString() @MaxLength(100) salaryExpectation?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsString() @MaxLength(10000) summary?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(100) experiences?: Record<string, unknown>[];
  @IsOptional() @IsArray() @ArrayMaxSize(100) education?: Record<string, unknown>[];
  @IsOptional() @IsBoolean() alertsEnabled?: boolean;
}
