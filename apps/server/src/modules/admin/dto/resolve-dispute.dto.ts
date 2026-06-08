import { IsString, IsNotEmpty, IsIn, MinLength, MaxLength } from "class-validator";

export class ResolveDisputeDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(["REFUND", "RELEASE"])
  action: "REFUND" | "RELEASE";

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason: string;
}
