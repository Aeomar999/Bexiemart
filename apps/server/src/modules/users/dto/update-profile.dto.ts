import { IsString, IsOptional, IsBoolean } from "class-validator";

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsBoolean() onboardingCompleted?: boolean;
}
