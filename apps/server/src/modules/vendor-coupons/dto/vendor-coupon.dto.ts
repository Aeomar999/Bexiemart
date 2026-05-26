import { IsString, IsNumber, Min, IsOptional, IsBoolean } from "class-validator";

export class CreateVendorCouponDto {
  @IsString() code: string;
  @IsNumber() @Min(0) discountPercent: number;
  @IsNumber() @Min(0) @IsOptional() minOrderAmount?: number;
  @IsNumber() @IsOptional() maxUses?: number;
  @IsString() expiresAt: string; // ISO date string
}

export class UpdateVendorCouponDto {
  @IsOptional() @IsNumber() @Min(0) discountPercent?: number;
  @IsOptional() @IsNumber() @Min(0) minOrderAmount?: number;
  @IsOptional() @IsNumber() maxUses?: number;
  @IsOptional() @IsString() expiresAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
