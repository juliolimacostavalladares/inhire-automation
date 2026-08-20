import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class GenerateTailoredResumeDto {
  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;

  @IsOptional()
  @IsIn(['pt-BR', 'en'])
  language?: 'pt-BR' | 'en';
}
