import { IsNumber, Min } from "class-validator";

export class UpdateFoodCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
