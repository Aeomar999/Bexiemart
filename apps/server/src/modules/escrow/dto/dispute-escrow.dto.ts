import { IsString, MinLength, MaxLength } from "class-validator";

export class DisputeEscrowDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason: string;
}
