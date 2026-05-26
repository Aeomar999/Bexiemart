import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class AddFoodCartItemDto {
  @IsString()
  foodItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
