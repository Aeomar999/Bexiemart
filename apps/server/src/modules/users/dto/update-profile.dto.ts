import { IsString, IsOptional, IsBoolean, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  @IsOptional() @IsString() @MaxLength(120) location?: string;
  @IsOptional() @IsBoolean() onboardingCompleted?: boolean;
}
