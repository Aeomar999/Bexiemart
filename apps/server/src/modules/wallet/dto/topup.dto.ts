import { IsNumber, IsString, Min } from "class-validator";

export class TopupDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  channel: string;
}
