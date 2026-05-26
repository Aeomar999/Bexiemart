import { IsEmail, IsNumber, IsString, Min } from "class-validator";

export class TransferDto {
  @IsEmail()
  recipientEmail: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  pin: string;
}
