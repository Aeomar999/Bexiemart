import { IsBoolean, IsOptional } from "class-validator";

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() newOrder?: boolean;
  @IsOptional() @IsBoolean() orderCancel?: boolean;
  @IsOptional() @IsBoolean() payout?: boolean;
  @IsOptional() @IsBoolean() chat?: boolean;
  @IsOptional() @IsBoolean() promo?: boolean;
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() sms?: boolean;
}
