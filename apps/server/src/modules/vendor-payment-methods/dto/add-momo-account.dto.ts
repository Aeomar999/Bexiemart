import { IsString } from "class-validator";

export class AddMomoAccountDto {
  @IsString()
  provider: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  accountName: string;
}
