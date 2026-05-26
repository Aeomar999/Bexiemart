import { IsString, MinLength } from "class-validator";

export class PinDto {
  @IsString()
  @MinLength(4)
  pin: string;
}
