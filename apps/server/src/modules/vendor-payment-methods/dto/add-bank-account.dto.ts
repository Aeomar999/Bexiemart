import { IsString } from "class-validator";

export class AddBankAccountDto {
  @IsString()
  bankName: string;

  @IsString()
  bankCode: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountName: string;
}
