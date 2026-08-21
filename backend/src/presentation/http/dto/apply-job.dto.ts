import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ApplyJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  salaryExpectation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contractType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  workModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverNote?: string;

  @IsOptional()
  @IsString()
  resumeType?: string;

  @IsOptional()
  answers?: Record<string, unknown>;

  @IsBoolean()
  privacyPolicyAccepted!: boolean;
}
