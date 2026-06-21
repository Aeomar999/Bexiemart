import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  minOrderAmount?: number;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;
}
