import { IsString, MinLength, MaxLength } from "class-validator";

export class RequestRefundDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}
