import { IsOptional, IsString } from "class-validator";

export class GenerateReferralDto {
  @IsOptional()
  @IsString()
  code?: string;
}
