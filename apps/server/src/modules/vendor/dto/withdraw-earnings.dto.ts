import { IsNumber, IsString, Min } from "class-validator";

export class WithdrawEarningsDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  destination: string;
}
