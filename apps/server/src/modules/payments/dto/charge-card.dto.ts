import { IsString, IsNotEmpty } from "class-validator";

export class ChargeCardDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  cardId: string;
}
