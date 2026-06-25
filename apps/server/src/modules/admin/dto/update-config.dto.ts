import { IsOptional, IsNumber, Min } from "class-validator";

export class UpdateConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  withdrawalFeeFlat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minTopup?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTopup?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyWithdrawalLimit?: number;

  // ─── Delivery pricing knobs ──────────────────────────────────────────────
  @IsOptional() @IsNumber() @Min(0) deliveryBaseFare?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryPerKm?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryPerMin?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryMinFee?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryCommissionRate?: number;
  @IsOptional() @IsNumber() @Min(0) deliverySurgeMultiplier?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryBikeMultiplier?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryCarMultiplier?: number;
  @IsOptional() @IsNumber() @Min(0) deliveryVanMultiplier?: number;
}
