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
}
