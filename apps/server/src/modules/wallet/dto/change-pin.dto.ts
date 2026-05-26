import { IsString, MinLength } from "class-validator";

export class ChangePinDto {
  @IsString()
  @MinLength(4)
  currentPin: string;

  @IsString()
  @MinLength(4)
  newPin: string;
}
