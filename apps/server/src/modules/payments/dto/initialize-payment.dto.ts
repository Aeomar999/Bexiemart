import { IsString, IsOptional, IsNumber } from "class-validator";

export class InitializePaymentDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}
